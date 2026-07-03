import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSlug } from './utils';

// ---------------------------------------------------------------------------
// VaultGold: The Heist
// A mission-based arcade game. Catch leaked vinyls, dodge label takedowns.
// Every mission you clear unlocks a real vaulted era that plays on its tracker.
// ---------------------------------------------------------------------------

const GOLD = '#FFD700';
const STORAGE_KEY = 'vaultgold_heist_v1';

// Each reward maps to a REAL unreleased/vaulted era. Playing deep-links into the
// actual artist tracker via /{artist}/album/{era-slug}, which resolves & plays it.
interface Reward {
  id: string;
  artist: string;   // tracker slug, e.g. "yzygold"
  label: string;    // artist display name
  era: string;      // real era name (must match tracker data for the deep-link)
  letter: string;   // card letter
  accent: string;   // card accent color
  blurb: string;    // why it's legendary
}

interface Mission {
  id: string;
  title: string;
  desc: string;
}

const MISSIONS: Mission[] = [
  { id: 'dig', title: 'First Dig', desc: 'Catch 10 leaked vinyls in a single run.' },
  { id: 'survive', title: 'Beat the Takedown', desc: 'Survive 30 seconds without going broke.' },
  { id: 'score', title: 'Gold Rush', desc: 'Bank a score of 500 in one run.' },
  { id: 'flawless', title: 'Untouchable', desc: 'Grab 12+ vinyls and never take a hit.' },
  { id: 'legend', title: 'Vault Master', desc: 'Reach 1,500 lifetime score across all runs.' },
];

// The shuffle pool. Every reward is a REAL vaulted era — clearing a mission draws
// a random one you don't already have, so no two runs of the vault look alike.
const REWARD_POOL: Reward[] = [
  { id: 'gaj', artist: 'yzygold', label: 'Ye', era: 'Good Ass Job', letter: 'YZY', accent: '#C9A224', blurb: 'The legendary scrapped 4th Kanye album.' },
  { id: 'yandhi', artist: 'yzygold', label: 'Ye', era: 'Yandhi [V2]', letter: 'YZY', accent: '#C9A224', blurb: 'The shelved album that became Jesus Is King.' },
  { id: 'ine', artist: 'drizzygold', label: 'Drake', era: "It's Never Enough", letter: 'OVO', accent: '#b8860b', blurb: 'Drake\'s early pre-fame mixtape era.' },
  { id: 'scorpion1', artist: 'drizzygold', label: 'Drake', era: 'Scorpion [V1]', letter: 'OVO', accent: '#b8860b', blurb: 'The original cut before the final album.' },
  { id: 'c4', artist: 'kdotgold', label: 'Kendrick Lamar', era: 'C4', letter: 'KDT', accent: '#1e3a5f', blurb: 'Kendrick\'s early Lil Wayne-inspired tape.' },
  { id: 'tpac1', artist: 'kdotgold', label: 'Kendrick Lamar', era: 'Tu Pimp A Caterpillar [V1]', letter: 'KDT', accent: '#1e3a5f', blurb: 'The early build of To Pimp A Butterfly.' },
  { id: 'lir2', artist: 'uzigold', label: 'Lil Uzi Vert', era: 'Luv Is Rage 2 [V1]', letter: 'UZI', accent: '#e8621a', blurb: 'The famously scrapped first cut of LIR2.' },
  { id: 'ea1', artist: 'uzigold', label: 'Lil Uzi Vert', era: 'Eternal Atake [V1]', letter: 'UZI', accent: '#e8621a', blurb: 'The long-delayed original Eternal Atake.' },
  { id: 'evil', artist: 'juicegold', label: 'Juice WRLD', era: 'Evil Twins', letter: 'JCE', accent: '#e53e3e', blurb: 'Juice WRLD\'s unreleased Cordae project.' },
  { id: 'outsiders', artist: 'juicegold', label: 'Juice WRLD', era: 'The Outsiders', letter: 'JCE', accent: '#e53e3e', blurb: 'A vaulted, never-released Juice project.' },
  { id: 'bvf', artist: 'xgold', label: 'XXXTENTACION', era: 'Bad Vibes Forever', letter: 'XXX', accent: '#4a0e8f', blurb: 'The heavily-vaulted posthumous era.' },
  { id: 'migothug', artist: 'slimegold', label: 'Young Thug', era: 'MigoThuggin', letter: 'THUG', accent: '#ec4899', blurb: 'The unreleased Migos x Thug tape.' },
  { id: 'stolen', artist: 'macgold', label: 'Mac Miller', era: 'Stolen Youth', letter: 'M', accent: '#ca8a04', blurb: 'A cult-favorite vaulted Mac Miller tape.' },
  { id: 'akncudi', artist: 'cudigold', label: 'Kid Cudi', era: 'A Kid Named Cudi', letter: 'CUDI', accent: '#6366f1', blurb: 'The mixtape that started it all.' },
];

const REWARD_BY_ID: Record<string, Reward> = Object.fromEntries(REWARD_POOL.map(r => [r.id, r]));

interface SaveData {
  highScore: number;
  totalScore: number;
  completed: Record<string, boolean>;
  // which random reward each cleared mission drew: { missionId: rewardId }
  assignments: Record<string, string>;
}

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const assignments: Record<string, string> = p.assignments || {};
      // Migrate old fixed-reward saves: pair each completed mission with an old unlock.
      if (!p.assignments && p.unlocked) {
        const oldUnlocked = Object.keys(p.unlocked).filter(id => REWARD_BY_ID[id]);
        Object.keys(p.completed || {}).forEach((mid, i) => {
          if (oldUnlocked[i]) assignments[mid] = oldUnlocked[i];
        });
      }
      return {
        highScore: p.highScore || 0,
        totalScore: p.totalScore || 0,
        completed: p.completed || {},
        assignments,
      };
    }
  } catch { /* ignore */ }
  return { highScore: 0, totalScore: 0, completed: {}, assignments: {} };
}

function saveSave(d: SaveData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

// ---- The game engine -------------------------------------------------------

type Phase = 'menu' | 'playing' | 'over';

interface RunStats {
  score: number;
  vinyls: number;
  seconds: number;
  hits: number;
}

interface Faller {
  x: number;
  y: number;
  vy: number;
  r: number;
  kind: 'vinyl' | 'gold' | 'takedown';
  spin: number;
}

const W = 460;
const H = 640;
const START_LIVES = 3;

export function GamePage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('menu');
  const [save, setSave] = useState<SaveData>(loadSave);
  const [hud, setHud] = useState({ score: 0, vinyls: 0, lives: START_LIVES, time: 0 });
  const [lastRun, setLastRun] = useState<{ stats: RunStats; newlyUnlocked: Reward[] } | null>(null);

  // Mutable game world kept in a ref so the RAF loop doesn't trigger re-renders.
  const world = useRef({
    playerX: W / 2,
    targetX: W / 2,
    fallers: [] as Faller[],
    lives: START_LIVES,
    stats: { score: 0, vinyls: 0, seconds: 0, hits: 0 } as RunStats,
    spawnTimer: 0,
    elapsed: 0,
    running: false,
    flash: 0,
    combo: 0,
  });
  const rafRef = useRef<number>(0);
  const keys = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  const resetWorld = () => {
    world.current = {
      playerX: W / 2, targetX: W / 2, fallers: [], lives: START_LIVES,
      stats: { score: 0, vinyls: 0, seconds: 0, hits: 0 },
      spawnTimer: 0, elapsed: 0, running: true, flash: 0, combo: 0,
    };
  };

  const finishRun = useCallback((stats: RunStats) => {
    setSave(prev => {
      const next: SaveData = {
        highScore: Math.max(prev.highScore, stats.score),
        totalScore: prev.totalScore + stats.score,
        completed: { ...prev.completed },
        assignments: { ...prev.assignments },
      };
      // Shuffle the rewards you don't already have; each new mission draws from it.
      const used = new Set(Object.values(next.assignments));
      const bag = REWARD_POOL.filter(r => !used.has(r.id)).sort(() => Math.random() - 0.5);
      const newlyUnlocked: Reward[] = [];
      const check = (m: Mission, done: boolean) => {
        if (done && !next.completed[m.id]) {
          next.completed[m.id] = true;
          const drawn = bag.pop();
          if (drawn) {
            next.assignments[m.id] = drawn.id;
            newlyUnlocked.push(drawn);
          }
        }
      };
      check(MISSIONS[0], stats.vinyls >= 10);
      check(MISSIONS[1], stats.seconds >= 30);
      check(MISSIONS[2], stats.score >= 500);
      check(MISSIONS[3], stats.vinyls >= 12 && stats.hits === 0);
      check(MISSIONS[4], next.totalScore >= 1500);
      saveSave(next);
      setLastRun({ stats, newlyUnlocked });
      return next;
    });
    setPhase('over');
  }, []);

  // Main loop
  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = world.current;
      if (!g.running) return;

      g.elapsed += dt;
      g.stats.seconds = g.elapsed;

      // difficulty ramps over time
      const difficulty = 1 + g.elapsed / 25;
      const spawnEvery = Math.max(0.35, 0.9 / difficulty);

      // input -> target
      if (keys.current.left) g.targetX -= 620 * dt;
      if (keys.current.right) g.targetX += 620 * dt;
      g.targetX = Math.max(30, Math.min(W - 30, g.targetX));
      // ease player toward target
      g.playerX += (g.targetX - g.playerX) * Math.min(1, dt * 16);

      // spawn
      g.spawnTimer -= dt;
      if (g.spawnTimer <= 0) {
        g.spawnTimer = spawnEvery;
        const roll = Math.random();
        const kind: Faller['kind'] = roll < 0.24 ? 'takedown' : roll < 0.32 ? 'gold' : 'vinyl';
        g.fallers.push({
          x: 30 + Math.random() * (W - 60),
          y: -30,
          vy: (140 + Math.random() * 70) * difficulty,
          r: kind === 'takedown' ? 20 : kind === 'gold' ? 15 : 17,
          kind,
          spin: Math.random() * Math.PI,
        });
      }

      // update fallers + collisions
      const catchY = H - 70;
      const nextFallers: Faller[] = [];
      for (const f of g.fallers) {
        f.y += f.vy * dt;
        f.spin += dt * 4;
        const dx = f.x - g.playerX;
        const withinX = Math.abs(dx) < 42 + f.r;
        const withinY = f.y > catchY - 26 && f.y < catchY + 30;
        if (withinX && withinY) {
          if (f.kind === 'takedown') {
            g.lives -= 1;
            g.stats.hits += 1;
            g.combo = 0;
            g.flash = 1;
            if (g.lives <= 0) {
              g.running = false;
              finishRun({ ...g.stats });
              return;
            }
          } else {
            g.combo += 1;
            const base = f.kind === 'gold' ? 50 : 15;
            g.stats.score += base + g.combo * 2;
            g.stats.vinyls += 1;
          }
          continue; // consumed
        }
        if (f.y > H + 40) continue; // off screen
        nextFallers.push(f);
      }
      g.fallers = nextFallers;
      if (g.flash > 0) g.flash = Math.max(0, g.flash - dt * 3);

      // ---- draw ----
      ctx.clearRect(0, 0, W, H);
      // bg
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0c0c0e');
      grad.addColorStop(1, '#141110');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // subtle vault grid
      ctx.strokeStyle = 'rgba(255,215,0,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < W; i += 46) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      for (let j = 0; j < H; j += 46) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke(); }

      // fallers
      for (const f of g.fallers) {
        if (f.kind === 'takedown') {
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(Math.sin(f.spin) * 0.12);
          ctx.fillStyle = '#c0392b';
          ctx.strokeStyle = '#ff6b5b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.rect(-f.r, -f.r, f.r * 2, f.r * 2);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('C&D', 0, 0);
          ctx.restore();
        } else {
          const isGold = f.kind === 'gold';
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.spin);
          // vinyl body
          ctx.beginPath();
          ctx.arc(0, 0, f.r, 0, Math.PI * 2);
          ctx.fillStyle = isGold ? GOLD : '#1c1c1c';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = isGold ? '#fff3b0' : GOLD;
          ctx.stroke();
          // label
          ctx.beginPath();
          ctx.arc(0, 0, f.r * 0.42, 0, Math.PI * 2);
          ctx.fillStyle = isGold ? '#7a5c00' : GOLD;
          ctx.fill();
          // center hole
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#000';
          ctx.fill();
          ctx.restore();
        }
      }

      // player crate (vault safe)
      ctx.save();
      ctx.translate(g.playerX, catchY);
      ctx.fillStyle = g.flash > 0 ? '#7a2018' : '#2a2620';
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const pw = 46;
      ctx.rect(-pw, -20, pw * 2, 40);
      ctx.fill(); ctx.stroke();
      // safe dial
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(8, -6);
      ctx.stroke();
      ctx.restore();

      // hit flash overlay
      if (g.flash > 0) {
        ctx.fillStyle = `rgba(192,57,43,${g.flash * 0.28})`;
        ctx.fillRect(0, 0, W, H);
      }

      // sync HUD (cheap; numbers only)
      setHud({ score: Math.round(g.stats.score), vinyls: g.stats.vinyls, lives: g.lives, time: g.elapsed });

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, finishRun]);

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // pointer / touch steering
  const pointerMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    world.current.targetX = Math.max(30, Math.min(W - 30, x));
  };

  const startGame = () => {
    resetWorld();
    setHud({ score: 0, vinyls: 0, lives: START_LIVES, time: 0 });
    setPhase('playing');
  };

  const unlockedRewards = MISSIONS
    .map(m => REWARD_BY_ID[save.assignments[m.id]])
    .filter((r): r is Reward => !!r);

  const playReward = (r: Reward) => {
    navigate(`/${r.artist}/album/${createSlug(r.era)}`);
  };

  const rerollVault = () => {
    if (!window.confirm('Re-roll the vault? This wipes your mission progress and unlocked albums so you can draw a fresh set.')) return;
    const fresh: SaveData = { highScore: save.highScore, totalScore: 0, completed: {}, assignments: {} };
    saveSave(fresh);
    setSave(fresh);
  };

  // ---- render ----
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0b', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 60px' }}>
      {/* header */}
      <div style={{ width: '100%', maxWidth: 940, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>← Back to trackers</button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>HIGH SCORE</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: GOLD }}>{save.highScore.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900, letterSpacing: 1, color: GOLD, textShadow: '0 0 24px rgba(255,215,0,0.35)' }}>THE HEIST</h1>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>Catch the leaks. Dodge the takedowns. Crack the vault.</p>
      </div>

      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 940, marginTop: 12 }}>
        {/* Game stage */}
        <div style={{ position: 'relative', width: W, maxWidth: '100%' }}>
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid rgba(255,215,0,0.25)`, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              style={{ display: 'block', width: '100%', height: 'auto', touchAction: 'none', cursor: phase === 'playing' ? 'none' : 'default' }}
              onMouseMove={e => phase === 'playing' && pointerMove(e.clientX)}
              onTouchMove={e => { if (phase === 'playing' && e.touches[0]) pointerMove(e.touches[0].clientX); }}
            />

            {/* HUD */}
            {phase === 'playing' && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none', textShadow: '0 1px 4px #000' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{hud.score.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{hud.vinyls} vinyls · {hud.time.toFixed(0)}s</div>
                </div>
                <div style={{ fontSize: 18 }}>{'♦'.repeat(hud.lives)}<span style={{ opacity: 0.25 }}>{'♦'.repeat(Math.max(0, START_LIVES - hud.lives))}</span></div>
              </div>
            )}

            {/* Menu overlay */}
            {phase === 'menu' && (
              <div style={overlay}>
                <div style={{ fontSize: 46, marginBottom: 6 }}>🎧</div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', maxWidth: 300, textAlign: 'center', lineHeight: 1.5, marginBottom: 18 }}>
                  Move your safe with <b style={{ color: GOLD }}>← →</b>, <b style={{ color: GOLD }}>A/D</b>, or your finger.<br />
                  Catch gold vinyls, avoid the <b style={{ color: '#ff6b5b' }}>C&D</b> takedowns.
                </div>
                <button onClick={startGame} style={playBtn}>▶ Start the heist</button>
              </div>
            )}

            {/* Game over overlay */}
            {phase === 'over' && lastRun && (
              <div style={{ ...overlay, overflowY: 'auto' }}>
                <div style={{ fontSize: 13, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>BUSTED</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: GOLD, margin: '2px 0 4px' }}>{lastRun.stats.score.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>
                  {lastRun.stats.vinyls} vinyls · {lastRun.stats.seconds.toFixed(0)}s survived · {lastRun.stats.hits} takedowns
                </div>
                {lastRun.newlyUnlocked.length > 0 ? (
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: `1px solid ${GOLD}`, borderRadius: 12, padding: '12px 14px', marginBottom: 14, maxWidth: 320 }}>
                    <div style={{ color: GOLD, fontWeight: 800, fontSize: 13, marginBottom: 8, textAlign: 'center' }}>🔓 VAULT CRACKED — NEW UNLOCK{lastRun.newlyUnlocked.length > 1 ? 'S' : ''}!</div>
                    {lastRun.newlyUnlocked.map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 7, background: r.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, flexShrink: 0 }}>{r.letter}</div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{r.era}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{r.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 14, maxWidth: 300, textAlign: 'center' }}>No new unlocks this run. Check the missions below and try again.</div>
                )}
                <button onClick={startGame} style={playBtn}>↻ Run it back</button>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Gold vinyl = +50 · dark vinyl = +15 · combos stack · C&D = −1 life</div>
        </div>

        {/* Missions + Vault */}
        <div style={{ flex: 1, minWidth: 300, maxWidth: 440 }}>
          <h2 style={sectionH}>Missions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MISSIONS.map(m => {
              const done = save.completed[m.id];
              const won = done ? REWARD_BY_ID[save.assignments[m.id]] : undefined;
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: done ? 'rgba(255,215,0,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${done ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}` }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${done ? GOLD : 'rgba(255,255,255,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: 14, flexShrink: 0 }}>{done ? '✓' : ''}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: done ? GOLD : '#fff' }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{m.desc}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      {won
                        ? <>Won: <b style={{ color: 'rgba(255,255,255,0.65)' }}>{won.era}</b> — {won.label}</>
                        : <>Reward: <b style={{ color: 'rgba(255,255,255,0.55)' }}>🎁 Mystery vault record</b></>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
            <h2 style={{ ...sectionH, margin: 0 }}>Your Vault <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontSize: 13 }}>({unlockedRewards.length}/{MISSIONS.length})</span></h2>
            {unlockedRewards.length > 0 && (
              <button onClick={rerollVault} title="Wipe progress and draw a fresh shuffle" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>🎲 Re-roll</button>
            )}
          </div>
          {unlockedRewards.length === 0 ? (
            <div style={{ padding: '18px 14px', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 10, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Empty. Clear a mission to draw a random unreleased album from the vault — then play it right here.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {unlockedRewards.map(r => (
                <button key={r.id} onClick={() => playReward(r)} style={{ textAlign: 'left', cursor: 'pointer', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: r.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 10, flexShrink: 0 }}>{r.letter}</div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.era}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{r.label}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.35 }}>{r.blurb}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>▶ Play in vault</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'absolute', inset: 0, background: 'rgba(8,8,10,0.86)', backdropFilter: 'blur(3px)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20,
};

const playBtn: React.CSSProperties = {
  background: GOLD, color: '#111', border: 'none', borderRadius: 10, padding: '12px 26px',
  fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 24px rgba(255,215,0,0.35)',
};

const sectionH: React.CSSProperties = { fontSize: 15, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', margin: '0 0 10px' };
