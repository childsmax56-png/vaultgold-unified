import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSlug } from './utils';

// ---------------------------------------------------------------------------
// VAULT RUNNER
// A Sonic-style 2D platformer. Pick a rapper, run their level, and collect
// their real unreleased projects scattered through it. Each one you grab
// unlocks in your vault and plays on that artist's actual tracker.
// ---------------------------------------------------------------------------

const GOLD = '#FFD700';
const STORAGE_KEY = 'vaultgold_runner_v1';

// ---- world / physics -------------------------------------------------------
const W = 820;
const H = 460;
const GROUND_Y = H - 52;
const GRAV = 2100;
const MOVE_ACCEL = 1750;
const AIR_ACCEL = 1250;
const FRICTION = 1600;
const MAX_RUN = 440;
const JUMP_V = -760;
const START_LIVES = 3;

// ---- characters + their real vaulted collectibles --------------------------
interface EraDrop { era: string; blurb: string }
interface Character {
  id: string;      // tracker slug — deep-links to /{id}/album/{slug(era)}
  name: string;
  letter: string;
  accent: string;
  sky: [string, string];
  eras: EraDrop[];
}

const CHARACTERS: Character[] = [
  {
    id: 'yzygold', name: 'Ye', letter: 'YZY', accent: '#C9A224', sky: ['#3a2a5e', '#241640'],
    eras: [
      { era: 'Good Ass Job', blurb: 'The scrapped fourth college-series album.' },
      { era: 'Yandhi [V2]', blurb: 'The shelved record that became Jesus Is King.' },
      { era: 'Cruel Winter [V1]', blurb: 'The lost G.O.O.D. Music compilation.' },
    ],
  },
  {
    id: 'drizzygold', name: 'Drake', letter: 'OVO', accent: '#b8860b', sky: ['#123f3f', '#08201f'],
    eras: [
      { era: "It's Never Enough", blurb: "Drake's earliest pre-fame mixtape." },
      { era: 'Scorpion [V1]', blurb: 'The original cut before the double album.' },
      { era: 'Certified Lover Boy [V2]', blurb: 'An alternate build of CLB.' },
    ],
  },
  {
    id: 'kdotgold', name: 'Kendrick Lamar', letter: 'KDT', accent: '#2f6ba8', sky: ['#1e3a5f', '#0d1c30'],
    eras: [
      { era: 'C4', blurb: 'His early Lil Wayne-inspired mixtape.' },
      { era: 'Tu Pimp A Caterpillar [V1]', blurb: 'The early build of To Pimp A Butterfly.' },
      { era: 'Overly Dedicated', blurb: 'The breakout project, vault cuts and all.' },
    ],
  },
  {
    id: 'uzigold', name: 'Lil Uzi Vert', letter: 'UZI', accent: '#e8621a', sky: ['#5a2c00', '#301500'],
    eras: [
      { era: 'Luv Is Rage 2 [V1]', blurb: 'The famously scrapped first cut.' },
      { era: 'Eternal Atake [V1]', blurb: 'The long-delayed original version.' },
      { era: 'Pink Tape [V1]', blurb: 'An early version of the Pink Tape.' },
    ],
  },
  {
    id: 'juicegold', name: 'Juice WRLD', letter: 'JCE', accent: '#e53e3e', sky: ['#4a0028', '#26001a'],
    eras: [
      { era: 'Evil Twins', blurb: 'The unreleased Cordae collab project.' },
      { era: 'The Outsiders', blurb: 'A never-released Juice project.' },
      { era: 'JuiceWRLD 9 9 9', blurb: 'Vaulted early 999 material.' },
    ],
  },
];

const eraKey = (charId: string, era: string) => `${charId}::${era}`;
interface EraInfo { char: Character; era: string; blurb: string }
const ERA_INDEX: Record<string, EraInfo> = {};
for (const c of CHARACTERS) for (const e of c.eras) ERA_INDEX[eraKey(c.id, e.era)] = { char: c, era: e.era, blurb: e.blurb };

// ---- persistence -----------------------------------------------------------
interface SaveData {
  unlocked: Record<string, boolean>;
  cleared: Record<string, boolean>;
}
function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { unlocked: p.unlocked || {}, cleared: p.cleared || {} };
    }
  } catch { /* ignore */ }
  return { unlocked: {}, cleared: {} };
}
function saveSave(d: SaveData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

// ---- level generation (seeded, deterministic per character) ----------------
function rng32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Rect { x: number; y: number; w: number; h: number }
interface Vinyl { x: number; y: number; taken: boolean }
interface Pickup { x: number; y: number; w: number; h: number; key: string; era: string; blurb: string; taken: boolean }
interface Enemy { x: number; y: number; w: number; h: number; dir: number; minX: number; maxX: number; spd: number; alive: boolean }
interface Level {
  platforms: (Rect & { ground?: boolean })[];
  vinyls: Vinyl[];
  hazards: Rect[];
  enemies: Enemy[];
  pickups: Pickup[];
  checkpoints: number[];
  goal: Rect;
  LEN: number;
}

function genLevel(char: Character, index: number): Level {
  const rng = rng32(1013 + index * 971);
  const LEN = 6600;
  const gy = GROUND_Y;
  const platforms: (Rect & { ground?: boolean })[] = [];
  const vinyls: Vinyl[] = [];
  const hazards: Rect[] = [];
  const enemies: Enemy[] = [];
  const pickups: Pickup[] = [];
  const grounds: { x: number; w: number }[] = [];

  let cx = 0;
  // opening safe pad
  platforms.push({ x: 0, y: gy, w: 360, h: H - gy, ground: true });
  grounds.push({ x: 0, w: 360 });
  cx = 360;

  while (cx < LEN) {
    // a pit before the next ground (jumpable) with a vinyl arc
    if (cx < LEN - 1100 && rng() < 0.5) {
      const pit = 130 + Math.floor(rng() * 110);
      const n = 5;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        vinyls.push({ x: cx + t * pit, y: gy - 74 - Math.sin(t * Math.PI) * 62, taken: false });
      }
      cx += pit;
    }
    let segW = 300 + Math.floor(rng() * 380);
    if (cx + segW > LEN) segW = LEN - cx;
    if (segW < 120) { platforms.push({ x: cx, y: gy, w: LEN - cx, h: H - gy, ground: true }); grounds.push({ x: cx, w: LEN - cx }); break; }
    platforms.push({ x: cx, y: gy, w: segW, h: H - gy, ground: true });
    const g = { x: cx, w: segW };
    grounds.push(g);

    // spikes on some ground
    if (rng() < 0.32) {
      const sw = 42 + rng() * 60;
      const sx = g.x + 60 + rng() * Math.max(10, g.w - 140 - sw);
      hazards.push({ x: sx, y: gy - 18, w: sw, h: 18 });
    }
    // a patrolling takedown bot
    if (rng() < 0.4 && g.w > 200) {
      const ex = g.x + 60 + rng() * (g.w - 140);
      enemies.push({ x: ex, y: gy - 34, w: 34, h: 34, dir: rng() < 0.5 ? -1 : 1, minX: g.x + 16, maxX: g.x + g.w - 16, spd: 70 + rng() * 55, alive: true });
    }
    // a row of vinyls on the ground
    if (rng() < 0.6) {
      const cnt = 3 + Math.floor(rng() * 3);
      const rx = g.x + 40;
      for (let i = 0; i < cnt; i++) vinyls.push({ x: rx + i * 36, y: gy - 42, taken: false });
    }
    // a floating platform above with vinyls
    if (rng() < 0.6) {
      const pw = 90 + rng() * 80;
      const px = g.x + rng() * Math.max(8, g.w - pw);
      const py = gy - (84 + rng() * 34);
      platforms.push({ x: px, y: py, w: pw, h: 16 });
      const cnt = Math.max(1, Math.floor(pw / 34));
      for (let i = 0; i < cnt; i++) vinyls.push({ x: px + 18 + i * 34, y: py - 28, taken: false });
    }
    cx += segW;
  }

  // Ensure the run ends on solid ground for the goal.
  const endG = grounds[grounds.length - 1];
  if (endG.x + endG.w < LEN) { platforms.push({ x: endG.x + endG.w, y: gy, w: LEN - (endG.x + endG.w), h: H - gy, ground: true }); grounds.push({ x: endG.x + endG.w, w: LEN - (endG.x + endG.w) }); }

  // Place the unreleased pickups, spread out, each on a reachable pad above ground.
  const checkpoints = [60];
  char.eras.forEach((e, i) => {
    const frac = (i + 1) / (char.eras.length + 1);
    const targetX = frac * LEN;
    const g = grounds.find(s => targetX >= s.x + 20 && targetX <= s.x + s.w - 20) || grounds[Math.min(grounds.length - 1, Math.floor(grounds.length * frac))];
    const pw = 130;
    const px = Math.min(Math.max(g.x + 30, targetX - pw / 2), g.x + g.w - pw - 20);
    const py = gy - (78 + (i % 2) * 32);
    platforms.push({ x: px, y: py, w: pw, h: 16 });
    pickups.push({ x: px + pw / 2 - 17, y: py - 50, w: 34, h: 44, key: eraKey(char.id, e.era), era: e.era, blurb: e.blurb, taken: false });
    // a couple of vinyl steps leading up
    vinyls.push({ x: px - 34, y: gy - 54, taken: false });
    vinyls.push({ x: px + pw / 2, y: py - 4, taken: false });
    checkpoints.push(px + pw / 2);
  });
  checkpoints.sort((a, b) => a - b);

  const goal: Rect = { x: LEN - 70, y: gy - 96, w: 40, h: 96 };
  return { platforms, vinyls, hazards, enemies, pickups, checkpoints, goal, LEN };
}

// ---------------------------------------------------------------------------
type Phase = 'select' | 'playing' | 'won' | 'dead';

interface Player {
  x: number; y: number; py: number; w: number; h: number;
  vx: number; vy: number; onGround: boolean; face: number;
  invuln: number; spin: number; checkpoint: number;
}

export function GamePage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [save, setSave] = useState<SaveData>(loadSave);
  const [charIdx, setCharIdx] = useState(0);
  const [hud, setHud] = useState({ vinyls: 0, found: 0, total: 0, lives: START_LIVES });
  const [toast, setToast] = useState<{ era: string; name: string; accent: string; letter: string } | null>(null);
  const [result, setResult] = useState<{ vinyls: number; found: number; total: number; foundKeys: string[] } | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rafRef = useRef<number>(0);
  const keys = useRef({ left: false, right: false, jump: false, jumpPressed: false });
  const unlockedRef = useRef<Set<string>>(new Set(Object.keys(save.unlocked)));
  useEffect(() => { unlockedRef.current = new Set(Object.keys(save.unlocked)); }, [save.unlocked]);

  const world = useRef<{
    level: Level; char: Character; p: Player; camX: number; time: number;
    lives: number; vinyls: number; found: number; running: boolean; hitFlash: number;
  } | null>(null);

  const showToast = (era: string, c: Character) => {
    setToast({ era, name: c.name, accent: c.accent, letter: c.letter });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  };

  const startLevel = (idx: number) => {
    const char = CHARACTERS[idx];
    const level = genLevel(char, idx);
    world.current = {
      level, char,
      p: { x: 60, y: GROUND_Y - 42, py: GROUND_Y - 42, w: 30, h: 42, vx: 0, vy: 0, onGround: false, face: 1, invuln: 0, spin: 0, checkpoint: 60 },
      camX: 0, time: 0, lives: START_LIVES, vinyls: 0, found: 0, running: true, hitFlash: 0,
    };
    setCharIdx(idx);
    setToast(null);
    setHud({ vinyls: 0, found: 0, total: char.eras.length, lives: START_LIVES });
    setPhase('playing');
  };

  const unlockEra = (key: string) => {
    const info = ERA_INDEX[key];
    if (!info) return;
    if (!unlockedRef.current.has(key)) {
      unlockedRef.current.add(key);
      setSave(prev => {
        const next: SaveData = { unlocked: { ...prev.unlocked, [key]: true }, cleared: { ...prev.cleared } };
        saveSave(next);
        return next;
      });
    }
    showToast(info.era, info.char);
  };

  // ---- game loop -----------------------------------------------------------
  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let last = performance.now();

    const overlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    const loop = (now: number) => {
      const wld = world.current;
      if (!wld || !wld.running) return;
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const { level, p, char } = wld;
      wld.time += dt;

      // ---- input / horizontal ----
      const dir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
      const accel = p.onGround ? MOVE_ACCEL : AIR_ACCEL;
      if (dir !== 0) { p.vx += dir * accel * dt; p.face = dir; }
      else if (p.onGround) {
        const f = FRICTION * dt;
        if (Math.abs(p.vx) <= f) p.vx = 0; else p.vx -= Math.sign(p.vx) * f;
      }
      p.vx = Math.max(-MAX_RUN, Math.min(MAX_RUN, p.vx));

      // jump
      if (keys.current.jumpPressed && p.onGround) { p.vy = JUMP_V; p.onGround = false; }
      keys.current.jumpPressed = false;

      // ---- integrate + one-way platform collision (land on tops only) ----
      p.py = p.y;
      p.x += p.vx * dt;
      if (p.x < 0) { p.x = 0; p.vx = 0; }
      p.vy += GRAV * dt;
      p.y += p.vy * dt;
      p.onGround = false;
      const prevBottom = p.py + p.h;
      for (const plat of level.platforms) {
        if (p.x + p.w > plat.x + 3 && p.x < plat.x + plat.w - 3) {
          const bottom = p.y + p.h;
          if (p.vy >= 0 && prevBottom <= plat.y + 8 && bottom >= plat.y) {
            p.y = plat.y - p.h; p.vy = 0; p.onGround = true;
          }
        }
      }
      if (p.onGround) p.spin = 0; else p.spin += dt * 12;
      if (p.invuln > 0) p.invuln -= dt;

      const hurt = () => {
        if (p.invuln > 0) return;
        if (wld.vinyls > 0) {
          wld.vinyls = Math.max(0, wld.vinyls - 12);
          p.invuln = 1.3; p.vy = -320; p.vx = -p.face * 240; wld.hitFlash = 1;
        } else {
          loseLife();
        }
      };
      const loseLife = () => {
        wld.lives -= 1; wld.hitFlash = 1;
        if (wld.lives <= 0) { wld.running = false; endLevel(false); return; }
        // respawn at last checkpoint reached
        const cp = [...level.checkpoints].reverse().find(c => c <= p.x) ?? 60;
        p.x = cp; p.y = GROUND_Y - p.h; p.py = p.y; p.vx = 0; p.vy = 0; p.invuln = 1.4;
      };

      // ---- vinyls ----
      for (const v of level.vinyls) {
        if (!v.taken && Math.abs((v.x) - (p.x + p.w / 2)) < 22 && Math.abs(v.y - (p.y + p.h / 2)) < 26) {
          v.taken = true; wld.vinyls += 1;
        }
      }
      // ---- pickups (unreleased) ----
      for (const pk of level.pickups) {
        if (!pk.taken && overlap(p, pk)) {
          pk.taken = true; wld.found += 1; unlockEra(pk.key);
        }
      }
      // ---- enemies ----
      for (const en of level.enemies) {
        if (!en.alive) continue;
        en.x += en.dir * en.spd * dt;
        if (en.x < en.minX) { en.x = en.minX; en.dir = 1; }
        if (en.x + en.w > en.maxX) { en.x = en.maxX - en.w; en.dir = -1; }
        if (overlap(p, en)) {
          const stomping = p.vy > 0 && p.py + p.h <= en.y + 12;
          if (stomping) { en.alive = false; p.vy = -430; wld.vinyls += 2; }
          else hurt();
        }
      }
      // ---- hazards ----
      for (const hz of level.hazards) if (overlap(p, hz)) hurt();
      // ---- fell in a pit ----
      if (p.y > H + 90) loseLife();
      // ---- goal ----
      if (overlap(p, level.goal)) { wld.running = false; endLevel(true); return; }

      if (wld.hitFlash > 0) wld.hitFlash = Math.max(0, wld.hitFlash - dt * 2.5);

      // ---- camera ----
      wld.camX = Math.max(0, Math.min(level.LEN - W, p.x - W * 0.38));

      // ================= DRAW =================
      const cam = wld.camX;
      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, char.sky[0]); sky.addColorStop(1, char.sky[1]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // parallax blobs
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 8; i++) {
        const bx = ((i * 340 - cam * 0.3) % (W + 300)) - 150;
        ctx.beginPath(); ctx.ellipse(((bx % (W + 300)) + (W + 300)) % (W + 300) - 150 + 150, 70 + (i % 3) * 40, 90, 30, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = `${char.accent}22`;
      for (let i = 0; i < 10; i++) {
        const bx = i * 260 - cam * 0.6;
        const sx = ((bx % (W + 260)) + (W + 260)) % (W + 260) - 130;
        ctx.fillRect(sx, H - 150 - (i % 4) * 26, 150, 200);
      }

      // platforms
      for (const plat of level.platforms) {
        const x = plat.x - cam;
        if (x > W || x + plat.w < 0) continue;
        if (plat.ground) {
          ctx.fillStyle = '#1c1712';
          ctx.fillRect(x, plat.y, plat.w, plat.h);
          ctx.fillStyle = char.accent;
          ctx.fillRect(x, plat.y, plat.w, 5);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          for (let gx = 0; gx < plat.w; gx += 34) ctx.fillRect(x + gx, plat.y + 10, 2, plat.h - 10);
        } else {
          ctx.fillStyle = '#2a231a';
          roundRect(ctx, x, plat.y, plat.w, plat.h, 6); ctx.fill();
          ctx.fillStyle = char.accent; ctx.fillRect(x, plat.y, plat.w, 4);
        }
      }

      // hazards (spikes)
      ctx.fillStyle = '#d94b3d';
      for (const hz of level.hazards) {
        const x = hz.x - cam;
        if (x > W || x + hz.w < 0) continue;
        const teeth = Math.floor(hz.w / 14);
        for (let t = 0; t < teeth; t++) {
          ctx.beginPath();
          ctx.moveTo(x + t * 14, hz.y + hz.h);
          ctx.lineTo(x + t * 14 + 7, hz.y);
          ctx.lineTo(x + t * 14 + 14, hz.y + hz.h);
          ctx.closePath(); ctx.fill();
        }
      }

      // vinyls
      for (const v of level.vinyls) {
        if (v.taken) continue;
        const x = v.x - cam;
        if (x > W + 20 || x < -20) continue;
        const wobble = Math.sin(wld.time * 5 + v.x) * 2;
        ctx.save(); ctx.translate(x, v.y + wobble);
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fillStyle = GOLD; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, Math.PI * 2); ctx.fillStyle = '#7a5c00'; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 1.2, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
        ctx.restore();
      }

      // pickups (unreleased crates)
      for (const pk of level.pickups) {
        if (pk.taken) continue;
        const x = pk.x - cam;
        if (x > W + 40 || x + pk.w < -40) continue;
        const bob = Math.sin(wld.time * 3 + pk.x) * 4;
        ctx.save(); ctx.translate(x + pk.w / 2, pk.y + pk.h / 2 + bob);
        ctx.shadowColor = GOLD; ctx.shadowBlur = 18;
        ctx.fillStyle = char.accent;
        roundRect(ctx, -pk.w / 2, -pk.h / 2, pk.w, pk.h, 6); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = GOLD; ctx.lineWidth = 2; roundRect(ctx, -pk.w / 2, -pk.h / 2, pk.w, pk.h, 6); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('♪', 0, 1);
        ctx.restore();
      }

      // goal (vault door)
      {
        const x = level.goal.x - cam;
        ctx.fillStyle = '#15110b'; roundRect(ctx, x, level.goal.y, level.goal.w, level.goal.h, 6); ctx.fill();
        ctx.strokeStyle = GOLD; ctx.lineWidth = 3; roundRect(ctx, x, level.goal.y, level.goal.w, level.goal.h, 6); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + level.goal.w / 2, level.goal.y + level.goal.h / 2, 11, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + level.goal.w / 2, level.goal.y + level.goal.h / 2); ctx.lineTo(x + level.goal.w / 2 + 7, level.goal.y + level.goal.h / 2 - 6); ctx.stroke();
      }

      // enemies
      for (const en of level.enemies) {
        if (!en.alive) continue;
        const x = en.x - cam;
        if (x > W || x + en.w < 0) continue;
        ctx.save(); ctx.translate(x + en.w / 2, en.y + en.h / 2);
        ctx.fillStyle = '#c0392b'; roundRect(ctx, -en.w / 2, -en.h / 2, en.w, en.h, 5); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('C&D', 0, 0);
        ctx.restore();
      }

      // player
      {
        const x = p.x - cam;
        const blink = p.invuln > 0 && Math.floor(wld.time * 20) % 2 === 0;
        if (!blink) {
          ctx.save(); ctx.translate(x + p.w / 2, p.y + p.h / 2);
          if (!p.onGround) ctx.rotate(p.spin * p.face);
          ctx.fillStyle = char.accent;
          roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, 10); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.beginPath(); ctx.arc(p.face * 5, -6, 4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#111';
          ctx.beginPath(); ctx.arc(p.face * 6.5, -6, 1.8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(char.letter, 0, 9);
          ctx.restore();
        }
      }

      if (wld.hitFlash > 0) { ctx.fillStyle = `rgba(217,75,61,${wld.hitFlash * 0.25})`; ctx.fillRect(0, 0, W, H); }

      setHud({ vinyls: wld.vinyls, found: wld.found, total: char.eras.length, lives: wld.lives });
      rafRef.current = requestAnimationFrame(loop);
    };

    const endLevel = (won: boolean) => {
      const wld = world.current!;
      const foundKeys = wld.level.pickups.filter(p => p.taken).map(p => p.key);
      if (won) setSave(prev => { const next = { unlocked: { ...prev.unlocked }, cleared: { ...prev.cleared, [wld.char.id]: true } }; saveSave(next); return next; });
      setResult({ vinyls: wld.vinyls, found: wld.found, total: wld.char.eras.length, foundKeys });
      setPhase(won ? 'won' : 'dead');
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ---- keyboard ------------------------------------------------------------
  useEffect(() => {
    const setKey = (e: KeyboardEvent, down: boolean) => {
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A': keys.current.left = down; break;
        case 'ArrowRight': case 'd': case 'D': keys.current.right = down; break;
        case 'ArrowUp': case 'w': case 'W': case ' ': case 'Spacebar':
          if (down && !keys.current.jump) keys.current.jumpPressed = true;
          keys.current.jump = down;
          e.preventDefault();
          break;
      }
    };
    const down = (e: KeyboardEvent) => setKey(e, true);
    const up = (e: KeyboardEvent) => setKey(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // touch button helpers
  const hold = (k: 'left' | 'right') => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); keys.current[k] = true; },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); keys.current[k] = false; },
    onPointerLeave: () => { keys.current[k] = false; },
  });
  const jumpBtn = {
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); if (!keys.current.jump) keys.current.jumpPressed = true; keys.current.jump = true; },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); keys.current.jump = false; },
  };

  const playEra = (key: string) => {
    const info = ERA_INDEX[key];
    if (info) navigate(`/${info.char.id}/album/${createSlug(info.era)}`);
  };

  const char = CHARACTERS[charIdx];
  const unlockedKeys = Object.keys(ERA_INDEX).filter(k => save.unlocked[k]);

  // ---- render --------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0b', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 14px 60px' }}>
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={() => (phase === 'playing' ? setPhase('select') : navigate('/'))} style={backBtn}>← {phase === 'playing' ? 'Quit level' : 'Back to trackers'}</button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>VAULT UNLOCKED</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: GOLD }}>{unlockedKeys.length}/{Object.keys(ERA_INDEX).length}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: 1, color: GOLD, textShadow: '0 0 24px rgba(255,215,0,0.35)' }}>VAULT RUNNER</h1>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>Run the level. Grab the unreleased. Reach the vault.</p>
      </div>

      {/* SELECT SCREEN */}
      {phase === 'select' && (
        <div style={{ width: '100%', maxWidth: 900 }}>
          <h2 style={sectionH}>Pick your rapper</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {CHARACTERS.map((c, i) => {
              const got = c.eras.filter(e => save.unlocked[eraKey(c.id, e.era)]).length;
              return (
                <button key={c.id} onClick={() => startLevel(i)} style={{ textAlign: 'left', cursor: 'pointer', padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${save.cleared[c.id] ? GOLD : 'rgba(255,255,255,0.1)'}`, color: '#fff' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, marginBottom: 8 }}>{c.letter}</div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{got}/{c.eras.length} unreleased found {save.cleared[c.id] ? '· ✓ cleared' : ''}</div>
                  <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: GOLD }}>▶ Play level</div>
                </button>
              );
            })}
          </div>

          <h2 style={{ ...sectionH, marginTop: 26 }}>Your Vault <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontSize: 13 }}>({unlockedKeys.length} unlocked)</span></h2>
          {unlockedKeys.length === 0 ? (
            <div style={{ padding: '18px 14px', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 10, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Empty. Grab an unreleased project in a level to unlock it here — then play it on the real tracker.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {unlockedKeys.map(k => {
                const info = ERA_INDEX[k];
                return (
                  <button key={k} onClick={() => playEra(k)} style={vaultCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 6, background: info.char.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 10, flexShrink: 0 }}>{info.char.letter}</div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{info.era}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{info.char.name}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.35 }}>{info.blurb}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>▶ Play in vault</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* GAME STAGE */}
      {(phase === 'playing' || phase === 'won' || phase === 'dead') && (
        <div style={{ position: 'relative', width: W, maxWidth: '100%' }}>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,215,0,0.25)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', width: '100%', height: 'auto', touchAction: 'none' }} />

            {/* HUD */}
            {phase === 'playing' && (
              <>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none', textShadow: '0 1px 4px #000' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: GOLD }}>◉ {hud.vinyls}</div>
                    <div style={{ fontSize: 12, color: '#fff', marginTop: 2 }}>♪ Unreleased {hud.found}/{hud.total}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18 }}>{'♥'.repeat(hud.lives)}<span style={{ opacity: 0.25 }}>{'♥'.repeat(Math.max(0, START_LIVES - hud.lives))}</span></div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{char.name}</div>
                  </div>
                </div>

                {toast && (
                  <div style={{ position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,215,0,0.14)', border: `1px solid ${GOLD}`, borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(3px)', boxShadow: '0 6px 20px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: toast.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 10 }}>{toast.letter}</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: GOLD }}>🔓 UNRELEASED RECOVERED</div>
                      <div style={{ fontSize: 12, color: '#fff' }}>{toast.era} — {toast.name}</div>
                    </div>
                  </div>
                )}

                {/* touch controls */}
                <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 8 }}>
                  <button {...hold('left')} style={touchBtn}>◀</button>
                  <button {...hold('right')} style={touchBtn}>▶</button>
                </div>
                <button {...jumpBtn} style={{ ...touchBtn, position: 'absolute', bottom: 12, right: 12, width: 64, height: 64, color: GOLD, borderColor: 'rgba(255,215,0,0.5)' }}>⤒</button>
              </>
            )}

            {/* WIN / LOSE overlay */}
            {(phase === 'won' || phase === 'dead') && result && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,10,0.88)', backdropFilter: 'blur(3px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
                <div style={{ fontSize: 13, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>{phase === 'won' ? 'VAULT REACHED' : 'GAME OVER'}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: GOLD, margin: '2px 0 6px' }}>{char.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>
                  ◉ {result.vinyls} vinyls · ♪ {result.found}/{result.total} unreleased recovered
                </div>
                {result.foundKeys.length > 0 && (
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: `1px solid ${GOLD}`, borderRadius: 12, padding: '12px 14px', marginBottom: 14, maxWidth: 340, width: '100%' }}>
                    <div style={{ color: GOLD, fontWeight: 800, fontSize: 13, marginBottom: 8, textAlign: 'center' }}>UNLOCKED — TAP TO PLAY</div>
                    {result.foundKeys.map(k => {
                      const info = ERA_INDEX[k];
                      return (
                        <button key={k} onClick={() => playEra(k)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 6, background: info.char.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 10, flexShrink: 0 }}>{info.char.letter}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{info.era}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{info.char.name}</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>▶</div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => startLevel(charIdx)} style={playBtn}>↻ {phase === 'won' ? 'Replay' : 'Retry'}</button>
                  <button onClick={() => setPhase('select')} style={{ ...playBtn, background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`, boxShadow: 'none' }}>Pick another rapper</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
            ← → / A D to run · Space / ↑ / W to jump · stomp the C&amp;D bots · grab every ♪
          </div>
        </div>
      )}
    </div>
  );
}

// small canvas helper
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const backBtn: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 };
const playBtn: React.CSSProperties = { background: GOLD, color: '#111', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 24px rgba(255,215,0,0.35)' };
const sectionH: React.CSSProperties = { fontSize: 15, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', margin: '0 0 12px' };
const vaultCard: React.CSSProperties = { textAlign: 'left', cursor: 'pointer', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', flexDirection: 'column', gap: 6 };
const touchBtn: React.CSSProperties = { width: 52, height: 52, borderRadius: 12, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 20, cursor: 'pointer', backdropFilter: 'blur(2px)', touchAction: 'none', userSelect: 'none' };
