import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSlug } from './utils';
import { getArtistConfig } from './artists/registry';

// ---------------------------------------------------------------------------
// VAULT RUNNER
// A Sonic-style 2D platformer. Pick a rapper, run their own themed level, and
// collect their real unreleased projects — shown with their actual cover art.
// Each one you grab unlocks in your vault and plays on that artist's tracker.
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

// ---- shared image cache for canvas cover art -------------------------------
const imgCache = new Map<string, HTMLImageElement>();
function getImg(url?: string): HTMLImageElement | null {
  if (!url) return null;
  let img = imgCache.get(url);
  if (!img) { img = new Image(); img.src = url; imgCache.set(url, img); }
  return img;
}
const imgReady = (img: HTMLImageElement | null): img is HTMLImageElement => !!img && img.complete && img.naturalWidth > 0;

// ---- level look + feel -----------------------------------------------------
type ThemeKind = 'heaven' | 'city' | 'westcoast' | 'neon' | 'galaxy';
interface LevelStyle {
  length: number;
  pitChance: number;    // chance of a pit before a ground segment
  floatChance: number;  // chance of a floating platform per segment
  enemyChance: number;
  spikeChance: number;
  maxFloatH: number;    // how high floating platforms rise
  segMin: number; segMax: number;
}

// ---- characters + their real vaulted collectibles --------------------------
interface EraDrop { era: string; blurb: string; cover?: string }
interface Character {
  id: string;      // tracker slug — deep-links to /{id}/album/{slug(era)}
  name: string;
  letter: string;
  accent: string;
  ground: string;          // ground base fill
  sky: [string, string];
  theme: ThemeKind;
  style: LevelStyle;
  eras: EraDrop[];
}

const CHARACTERS: Character[] = [
  {
    id: 'yzygold', name: 'Ye', letter: 'YZY', accent: '#C9A224', ground: '#2b2418',
    sky: ['#5a4a8a', '#241640'], theme: 'heaven',
    style: { length: 8200, pitChance: 0.42, floatChance: 0.62, enemyChance: 0.34, spikeChance: 0.3, maxFloatH: 120, segMin: 300, segMax: 700 },
    eras: [
      { era: 'Good Ass Job', blurb: 'The scrapped fourth college-series album.' },
      { era: 'Yandhi [V2]', blurb: 'The shelved record that became Jesus Is King.' },
      { era: 'Cruel Winter [V1]', blurb: 'The lost G.O.O.D. Music compilation.' },
      { era: 'Yeezus 2', blurb: 'The follow-up to Yeezus that never dropped.' },
      { era: 'Thank God For Drugs', blurb: 'A mythic, long-rumored vault project.' },
    ],
  },
  {
    id: 'drizzygold', name: 'Drake', letter: 'OVO', accent: '#d4a83a', ground: '#14100c',
    sky: ['#0e3a3a', '#06201f'], theme: 'city',
    style: { length: 9200, pitChance: 0.52, floatChance: 0.5, enemyChance: 0.26, spikeChance: 0.34, maxFloatH: 110, segMin: 280, segMax: 640 },
    eras: [
      { era: 'Scorpion [V1]', blurb: 'The original cut before the double album.' },
      { era: 'Certified Lover Boy [V2]', blurb: 'An alternate build of CLB.' },
      { era: 'ICEMAN [V2]', blurb: 'An early version of the ICEMAN era.' },
      { era: 'What A Time To Be Alive 2', blurb: 'The unreleased WATTBA sequel.' },
      { era: 'More Life', blurb: 'The playlist era, vault cuts and all.' },
    ],
  },
  {
    id: 'kdotgold', name: 'Kendrick Lamar', letter: 'KDT', accent: '#e07b39', ground: '#241a12',
    sky: ['#c65b2a', '#361a4a'], theme: 'westcoast',
    style: { length: 8600, pitChance: 0.4, floatChance: 0.55, enemyChance: 0.44, spikeChance: 0.3, maxFloatH: 118, segMin: 300, segMax: 660 },
    eras: [
      { era: 'C4', blurb: 'His early Lil Wayne-inspired mixtape.' },
      { era: 'Tu Pimp A Caterpillar [V1]', blurb: 'The early build of To Pimp A Butterfly.' },
      { era: 'Overly Dedicated', blurb: 'The breakout project, vault cuts and all.' },
      { era: 'Section.80', blurb: 'The debut album era with lost cuts.' },
      { era: 'Everybody Sensitive [V1]', blurb: 'An early version of a scrapped era.' },
    ],
  },
  {
    id: 'uzigold', name: 'Lil Uzi Vert', letter: 'UZI', accent: '#ff7a2f', ground: '#150a1e',
    sky: ['#20003a', '#08001a'], theme: 'neon',
    style: { length: 9800, pitChance: 0.46, floatChance: 0.78, enemyChance: 0.3, spikeChance: 0.32, maxFloatH: 130, segMin: 260, segMax: 560 },
    eras: [
      { era: 'Luv Is Rage 2 [V1]', blurb: 'The famously scrapped first cut.' },
      { era: 'Eternal Atake [V1]', blurb: 'The long-delayed original version.' },
      { era: 'Pink Tape [V1]', blurb: 'An early version of the Pink Tape.' },
      { era: 'The Perfect LUV Tape', blurb: 'The beloved mixtape era.' },
      { era: '1017 vs. The World', blurb: 'The early breakout tape.' },
    ],
  },
  {
    id: 'juicegold', name: 'Juice WRLD', letter: 'JCE', accent: '#e5484d', ground: '#16081c',
    sky: ['#3a0040', '#0a0016'], theme: 'galaxy',
    style: { length: 9200, pitChance: 0.48, floatChance: 0.58, enemyChance: 0.46, spikeChance: 0.4, maxFloatH: 116, segMin: 280, segMax: 600 },
    eras: [
      { era: 'Evil Twins', blurb: 'The unreleased Cordae collab project.' },
      { era: 'The Outsiders', blurb: 'A never-released Juice project.' },
      { era: 'JuiceWRLD 9 9 9', blurb: 'Vaulted early 999 material.' },
      { era: 'Death Race for Love', blurb: 'The album era with lost bonus cuts.' },
      { era: 'Heartbroken In Hollywood 9 9 9', blurb: 'An early, mostly-vaulted project.' },
    ],
  },
];

// Resolve each era's real cover from the artist config's CUSTOM_IMAGES (stays in sync).
for (const c of CHARACTERS) {
  const cfg = getArtistConfig(c.id);
  for (const e of c.eras) e.cover = cfg?.CUSTOM_IMAGES?.[e.era];
}

const eraKey = (charId: string, era: string) => `${charId}::${era}`;
interface EraInfo { char: Character; era: string; blurb: string; cover?: string }
const ERA_INDEX: Record<string, EraInfo> = {};
for (const c of CHARACTERS) for (const e of c.eras) ERA_INDEX[eraKey(c.id, e.era)] = { char: c, era: e.era, blurb: e.blurb, cover: e.cover };

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
interface Pickup { x: number; y: number; w: number; h: number; key: string; era: string; blurb: string; cover?: string; taken: boolean }
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
  const st = char.style;
  const rng = rng32(1013 + index * 971);
  const LEN = st.length;
  const gy = GROUND_Y;
  const platforms: (Rect & { ground?: boolean })[] = [];
  const vinyls: Vinyl[] = [];
  const hazards: Rect[] = [];
  const enemies: Enemy[] = [];
  const pickups: Pickup[] = [];
  const grounds: { x: number; w: number }[] = [];

  // opening safe pad
  platforms.push({ x: 0, y: gy, w: 360, h: H - gy, ground: true });
  grounds.push({ x: 0, w: 360 });
  let cx = 360;

  while (cx < LEN) {
    // a jumpable pit with a vinyl arc
    if (cx < LEN - 1100 && rng() < st.pitChance) {
      const pit = 130 + Math.floor(rng() * 110);
      const n = 5;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        vinyls.push({ x: cx + t * pit, y: gy - 74 - Math.sin(t * Math.PI) * 62, taken: false });
      }
      cx += pit;
    }
    let segW = st.segMin + Math.floor(rng() * (st.segMax - st.segMin));
    if (cx + segW > LEN) segW = LEN - cx;
    if (segW < 120) { platforms.push({ x: cx, y: gy, w: LEN - cx, h: H - gy, ground: true }); grounds.push({ x: cx, w: LEN - cx }); break; }
    platforms.push({ x: cx, y: gy, w: segW, h: H - gy, ground: true });
    const g = { x: cx, w: segW };
    grounds.push(g);

    if (rng() < st.spikeChance) {
      const sw = 42 + rng() * 60;
      const sx = g.x + 60 + rng() * Math.max(10, g.w - 140 - sw);
      hazards.push({ x: sx, y: gy - 18, w: sw, h: 18 });
    }
    if (rng() < st.enemyChance && g.w > 200) {
      const ex = g.x + 60 + rng() * (g.w - 140);
      enemies.push({ x: ex, y: gy - 34, w: 34, h: 34, dir: rng() < 0.5 ? -1 : 1, minX: g.x + 16, maxX: g.x + g.w - 16, spd: 70 + rng() * 55, alive: true });
    }
    if (rng() < 0.6) {
      const cnt = 3 + Math.floor(rng() * 3);
      const rx = g.x + 40;
      for (let i = 0; i < cnt; i++) vinyls.push({ x: rx + i * 36, y: gy - 42, taken: false });
    }
    if (rng() < st.floatChance) {
      const pw = 90 + rng() * 80;
      const px = g.x + rng() * Math.max(8, g.w - pw);
      const py = gy - (72 + rng() * (st.maxFloatH - 72));
      platforms.push({ x: px, y: py, w: pw, h: 16 });
      const cnt = Math.max(1, Math.floor(pw / 34));
      for (let i = 0; i < cnt; i++) vinyls.push({ x: px + 18 + i * 34, y: py - 28, taken: false });
      // sometimes a second, higher platform for extra verticality
      if (rng() < st.floatChance * 0.5) {
        const p2w = 70 + rng() * 50;
        const p2x = Math.min(px + 30, g.x + g.w - p2w);
        const p2y = py - (60 + rng() * 30);
        platforms.push({ x: p2x, y: p2y, w: p2w, h: 16 });
        for (let i = 0; i < Math.max(1, Math.floor(p2w / 34)); i++) vinyls.push({ x: p2x + 18 + i * 34, y: p2y - 28, taken: false });
      }
    }
    cx += segW;
  }

  const endG = grounds[grounds.length - 1];
  if (endG.x + endG.w < LEN) { platforms.push({ x: endG.x + endG.w, y: gy, w: LEN - (endG.x + endG.w), h: H - gy, ground: true }); grounds.push({ x: endG.x + endG.w, w: LEN - (endG.x + endG.w) }); }

  // 5 unreleased pickups, spread across the level, each on a reachable pad above ground.
  const checkpoints = [60];
  char.eras.forEach((e, i) => {
    const frac = (i + 1) / (char.eras.length + 1);
    const targetX = frac * LEN;
    const g = grounds.find(s => targetX >= s.x + 20 && targetX <= s.x + s.w - 20) || grounds[Math.min(grounds.length - 1, Math.floor(grounds.length * frac))];
    const pw = 120;
    const px = Math.min(Math.max(g.x + 30, targetX - pw / 2), g.x + g.w - pw - 20);
    const py = gy - (76 + (i % 2) * 30);
    platforms.push({ x: px, y: py, w: pw, h: 16 });
    pickups.push({ x: px + pw / 2 - 24, y: py - 56, w: 48, h: 48, key: eraKey(char.id, e.era), era: e.era, blurb: e.blurb, cover: e.cover, taken: false });
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
  const [toast, setToast] = useState<{ era: string; name: string; accent: string; letter: string; cover?: string } | null>(null);
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

  const showToast = (era: string, c: Character, cover?: string) => {
    setToast({ era, name: c.name, accent: c.accent, letter: c.letter, cover });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  };

  const startLevel = (idx: number) => {
    const char = CHARACTERS[idx];
    const level = genLevel(char, idx);
    level.pickups.forEach(pk => getImg(pk.cover)); // warm the cover images
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

  const unlockEra = (key: string, cover?: string) => {
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
    showToast(info.era, info.char, cover);
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

      const d = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
      const accel = p.onGround ? MOVE_ACCEL : AIR_ACCEL;
      if (d !== 0) { p.vx += d * accel * dt; p.face = d; }
      else if (p.onGround) { const f = FRICTION * dt; if (Math.abs(p.vx) <= f) p.vx = 0; else p.vx -= Math.sign(p.vx) * f; }
      p.vx = Math.max(-MAX_RUN, Math.min(MAX_RUN, p.vx));

      if (keys.current.jumpPressed && p.onGround) { p.vy = JUMP_V; p.onGround = false; }
      keys.current.jumpPressed = false;

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
          if (p.vy >= 0 && prevBottom <= plat.y + 8 && bottom >= plat.y) { p.y = plat.y - p.h; p.vy = 0; p.onGround = true; }
        }
      }
      if (p.onGround) p.spin = 0; else p.spin += dt * 12;
      if (p.invuln > 0) p.invuln -= dt;

      const hurt = () => {
        if (p.invuln > 0) return;
        if (wld.vinyls > 0) { wld.vinyls = Math.max(0, wld.vinyls - 12); p.invuln = 1.3; p.vy = -320; p.vx = -p.face * 240; wld.hitFlash = 1; }
        else loseLife();
      };
      const loseLife = () => {
        wld.lives -= 1; wld.hitFlash = 1;
        if (wld.lives <= 0) { wld.running = false; endLevel(false); return; }
        const cp = [...level.checkpoints].reverse().find(c => c <= p.x) ?? 60;
        p.x = cp; p.y = GROUND_Y - p.h; p.py = p.y; p.vx = 0; p.vy = 0; p.invuln = 1.4;
      };

      for (const v of level.vinyls) {
        if (!v.taken && Math.abs(v.x - (p.x + p.w / 2)) < 22 && Math.abs(v.y - (p.y + p.h / 2)) < 26) { v.taken = true; wld.vinyls += 1; }
      }
      for (const pk of level.pickups) {
        if (!pk.taken && overlap(p, pk)) { pk.taken = true; wld.found += 1; unlockEra(pk.key, pk.cover); }
      }
      for (const en of level.enemies) {
        if (!en.alive) continue;
        en.x += en.dir * en.spd * dt;
        if (en.x < en.minX) { en.x = en.minX; en.dir = 1; }
        if (en.x + en.w > en.maxX) { en.x = en.maxX - en.w; en.dir = -1; }
        if (overlap(p, en)) {
          if (p.vy > 0 && p.py + p.h <= en.y + 12) { en.alive = false; p.vy = -430; wld.vinyls += 2; }
          else hurt();
        }
      }
      for (const hz of level.hazards) if (overlap(p, hz)) hurt();
      if (p.y > H + 90) loseLife();
      if (overlap(p, level.goal)) { wld.running = false; endLevel(true); return; }
      if (wld.hitFlash > 0) wld.hitFlash = Math.max(0, wld.hitFlash - dt * 2.5);

      wld.camX = Math.max(0, Math.min(level.LEN - W, p.x - W * 0.38));
      const cam = wld.camX;

      // ================= DRAW =================
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, char.sky[0]); sky.addColorStop(1, char.sky[1]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      drawTheme(ctx, char, cam, wld.time);

      // platforms
      for (const plat of level.platforms) {
        const x = plat.x - cam;
        if (x > W || x + plat.w < 0) continue;
        if (plat.ground) {
          ctx.fillStyle = char.ground; ctx.fillRect(x, plat.y, plat.w, plat.h);
          ctx.fillStyle = char.accent; ctx.fillRect(x, plat.y, plat.w, 5);
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          for (let gx = 0; gx < plat.w; gx += 34) ctx.fillRect(x + gx, plat.y + 10, 2, plat.h - 10);
        } else {
          ctx.fillStyle = '#241d16'; roundRect(ctx, x, plat.y, plat.w, plat.h, 6); ctx.fill();
          ctx.fillStyle = char.accent; ctx.fillRect(x, plat.y, plat.w, 4);
        }
      }

      // hazards (spikes)
      ctx.fillStyle = '#d94b3d';
      for (const hz of level.hazards) {
        const x = hz.x - cam; if (x > W || x + hz.w < 0) continue;
        const teeth = Math.floor(hz.w / 14);
        for (let t = 0; t < teeth; t++) {
          ctx.beginPath();
          ctx.moveTo(x + t * 14, hz.y + hz.h); ctx.lineTo(x + t * 14 + 7, hz.y); ctx.lineTo(x + t * 14 + 14, hz.y + hz.h);
          ctx.closePath(); ctx.fill();
        }
      }

      // vinyls
      for (const v of level.vinyls) {
        if (v.taken) continue;
        const x = v.x - cam; if (x > W + 20 || x < -20) continue;
        const wob = Math.sin(wld.time * 5 + v.x) * 2;
        ctx.save(); ctx.translate(x, v.y + wob);
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fillStyle = GOLD; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, Math.PI * 2); ctx.fillStyle = '#7a5c00'; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 1.2, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
        ctx.restore();
      }

      // pickups (unreleased — drawn with real cover art)
      for (const pk of level.pickups) {
        if (pk.taken) continue;
        const x = pk.x - cam; if (x > W + 50 || x + pk.w < -50) continue;
        const bob = Math.sin(wld.time * 3 + pk.x) * 4;
        const img = getImg(pk.cover);
        ctx.save(); ctx.translate(x + pk.w / 2, pk.y + pk.h / 2 + bob);
        ctx.shadowColor = GOLD; ctx.shadowBlur = 20;
        roundRect(ctx, -pk.w / 2, -pk.h / 2, pk.w, pk.h, 7);
        if (imgReady(img)) { ctx.save(); ctx.clip(); ctx.drawImage(img, -pk.w / 2, -pk.h / 2, pk.w, pk.h); ctx.restore(); }
        else { ctx.fillStyle = char.accent; ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪', 0, 1); }
        ctx.shadowBlur = 0; ctx.strokeStyle = GOLD; ctx.lineWidth = 2.5; roundRect(ctx, -pk.w / 2, -pk.h / 2, pk.w, pk.h, 7); ctx.stroke();
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
        const x = en.x - cam; if (x > W || x + en.w < 0) continue;
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
          ctx.fillStyle = char.accent; roundRect(ctx, -p.w / 2, -p.h / 2, p.w, p.h, 10); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(p.face * 5, -6, 4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(p.face * 6.5, -6, 1.8, 0, Math.PI * 2); ctx.fill();
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
          keys.current.jump = down; e.preventDefault(); break;
      }
    };
    const down = (e: KeyboardEvent) => setKey(e, true);
    const up = (e: KeyboardEvent) => setKey(e, false);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

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
    <div style={{ minHeight: '100vh', background: '#0a0a0b', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 14px 60px', paddingTop: 'max(20px, calc(env(safe-area-inset-top) + 8px))' }}>
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
                <button key={c.id} onClick={() => startLevel(i)} style={{ textAlign: 'left', cursor: 'pointer', padding: 14, borderRadius: 12, background: `linear-gradient(160deg, ${c.sky[0]}55, rgba(255,255,255,0.03))`, border: `1px solid ${save.cleared[c.id] ? GOLD : 'rgba(255,255,255,0.1)'}`, color: '#fff' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, marginBottom: 8 }}>{c.letter}</div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{got}/{c.eras.length} unreleased found {save.cleared[c.id] ? '· ✓' : ''}</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
              {unlockedKeys.map(k => {
                const info = ERA_INDEX[k];
                return (
                  <button key={k} onClick={() => playEra(k)} style={vaultCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Cover url={info.cover} accent={info.char.accent} letter={info.char.letter} size={38} />
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
                    <Cover url={toast.cover} accent={toast.accent} letter={toast.letter} size={34} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: GOLD }}>🔓 UNRELEASED RECOVERED</div>
                      <div style={{ fontSize: 12, color: '#fff' }}>{toast.era} — {toast.name}</div>
                    </div>
                  </div>
                )}

                <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 8 }}>
                  <button {...hold('left')} style={touchBtn}>◀</button>
                  <button {...hold('right')} style={touchBtn}>▶</button>
                </div>
                <button {...jumpBtn} style={{ ...touchBtn, position: 'absolute', bottom: 12, right: 12, width: 64, height: 64, color: GOLD, borderColor: 'rgba(255,215,0,0.5)' }}>⤒</button>
              </>
            )}

            {(phase === 'won' || phase === 'dead') && result && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,10,0.88)', backdropFilter: 'blur(3px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
                <div style={{ fontSize: 13, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>{phase === 'won' ? 'VAULT REACHED' : 'GAME OVER'}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: GOLD, margin: '2px 0 6px' }}>{char.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>◉ {result.vinyls} vinyls · ♪ {result.found}/{result.total} unreleased recovered</div>
                {result.foundKeys.length > 0 && (
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: `1px solid ${GOLD}`, borderRadius: 12, padding: '12px 14px', marginBottom: 14, maxWidth: 360, width: '100%' }}>
                    <div style={{ color: GOLD, fontWeight: 800, fontSize: 13, marginBottom: 8, textAlign: 'center' }}>UNLOCKED — TAP TO PLAY</div>
                    {result.foundKeys.map(k => {
                      const info = ERA_INDEX[k];
                      return (
                        <button key={k} onClick={() => playEra(k)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                          <Cover url={info.cover} accent={info.char.accent} letter={info.char.letter} size={34} />
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

// ---- cover tile (real art with letter fallback) ---------------------------
function Cover({ url, accent, letter, size }: { url?: string; accent: string; letter: string; size: number }) {
  const [ok, setOk] = useState(true);
  if (url && ok) return <img src={url} onError={() => setOk(false)} style={{ width: size, height: size, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }} />;
  return <div style={{ width: size, height: size, borderRadius: 6, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 10, flexShrink: 0 }}>{letter}</div>;
}

// ---- per-rapper background textures ---------------------------------------
function drawTheme(ctx: CanvasRenderingContext2D, char: Character, cam: number, time: number) {
  const acc = char.accent;
  const wrap = (v: number, span: number) => ((v % span) + span) % span;
  if (char.theme === 'heaven') {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 6; i++) { const bx = wrap(i * 260 - cam * 0.5, W + 300) - 150; ctx.beginPath(); ctx.moveTo(bx, H - 52); ctx.lineTo(bx + 130, H - 200); ctx.lineTo(bx + 260, H - 52); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    for (let i = 0; i < 8; i++) { const bx = wrap(i * 230 - cam * 0.25, W + 320) - 160; const by = 60 + (i % 3) * 46; cloud(ctx, bx, by); }
  } else if (char.theme === 'city') {
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(W - 120, 80, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = char.sky[1]; ctx.beginPath(); ctx.arc(W - 130, 74, 24, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 16; i++) {
      const bx = wrap(i * 150 - cam * 0.45, W + 200) - 100; const bh = 90 + ((i * 53) % 130); const bw = 60 + ((i * 29) % 40);
      ctx.fillStyle = `${acc}22`; ctx.fillRect(bx, H - bh, bw, bh);
      ctx.fillStyle = `${acc}55`;
      for (let wy = H - bh + 10; wy < H - 20; wy += 18) for (let wx = bx + 8; wx < bx + bw - 8; wx += 16) if (((wx + wy) * (i + 1)) % 7 < 3) ctx.fillRect(wx, wy, 6, 8);
    }
  } else if (char.theme === 'westcoast') {
    const sun = ctx.createRadialGradient(160, 120, 10, 160, 120, 120); sun.addColorStop(0, '#ffd27a'); sun.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(160, 120, 120, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) { const bx = wrap(i * 240 - cam * 0.5, W + 300) - 150; palm(ctx, bx, H - 52, acc); }
  } else if (char.theme === 'neon') {
    for (let i = 0; i < 40; i++) { const bx = wrap(i * 90 - cam * 0.2, W + 60) - 30; const by = (i * 61) % (H - 120); ctx.fillStyle = i % 3 === 0 ? acc : 'rgba(255,255,255,0.5)'; ctx.fillRect(bx, by, 2, 2); }
    const bars = ['#ff2fd0', acc, '#2fd0ff', '#a24bff'];
    for (let i = 0; i < 14; i++) { const bx = wrap(i * 170 - cam * 0.5, W + 220) - 110; const bh = 120 + ((i * 47) % 160); ctx.fillStyle = bars[i % bars.length] + '33'; ctx.fillRect(bx, H - bh, 26, bh); ctx.fillStyle = bars[i % bars.length] + '99'; ctx.fillRect(bx, H - bh, 26, 4); }
  } else { // galaxy
    for (let i = 0; i < 60; i++) { const bx = wrap(i * 70 - cam * 0.15, W + 40) - 20; const by = (i * 83) % (H - 100); const tw = 0.5 + 0.5 * Math.sin(time * 2 + i); ctx.fillStyle = `rgba(255,255,255,${0.2 + tw * 0.5})`; ctx.fillRect(bx, by, tw > 0.8 ? 2 : 1, tw > 0.8 ? 2 : 1); }
    const mx = W - 130 - cam * 0.08; const glow = ctx.createRadialGradient(mx, 100, 20, mx, 100, 90); glow.addColorStop(0, `${acc}66`); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(mx, 100, 90, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 30px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.85; ctx.fillText('999', mx, 100); ctx.globalAlpha = 1;
  }
}
function cloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.arc(x + 18, y + 4, 20, 0, Math.PI * 2); ctx.arc(x + 40, y, 15, 0, Math.PI * 2); ctx.arc(x + 20, y - 8, 16, 0, Math.PI * 2); ctx.fill();
}
function palm(ctx: CanvasRenderingContext2D, x: number, groundY: number, acc: string) {
  ctx.strokeStyle = '#1c130c'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, groundY); ctx.quadraticCurveTo(x - 12, groundY - 70, x + 6, groundY - 130); ctx.stroke();
  ctx.strokeStyle = acc + '88'; ctx.lineWidth = 6;
  for (let a = -2; a <= 2; a++) { ctx.beginPath(); ctx.moveTo(x + 6, groundY - 130); ctx.quadraticCurveTo(x + 6 + a * 30, groundY - 150 - Math.abs(a) * 4, x + 6 + a * 62, groundY - 120 - Math.abs(a) * 8); ctx.stroke(); }
}

// small canvas helper
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const backBtn: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 };
const playBtn: React.CSSProperties = { background: GOLD, color: '#111', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 24px rgba(255,215,0,0.35)' };
const sectionH: React.CSSProperties = { fontSize: 15, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', margin: '0 0 12px' };
const vaultCard: React.CSSProperties = { textAlign: 'left', cursor: 'pointer', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', flexDirection: 'column', gap: 6 };
const touchBtn: React.CSSProperties = { width: 52, height: 52, borderRadius: 12, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 20, cursor: 'pointer', backdropFilter: 'blur(2px)', touchAction: 'none', userSelect: 'none' };
