import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSlug } from './utils';
import { ARTIST_LIST, getArtistConfig } from './artists/registry';
import type { ArtistConfig } from './artists/types';
import { useSnippetAudio } from './useSnippetAudio';
import { buildPool, norm, shuffle, type GameSong } from './snippetGameData';
import { DailyChallenge } from './DailyChallenge';

// ---------------------------------------------------------------------------
// NAME THAT LEAK
// Two modes off one entry:
//  • Daily   — a Wordle-style puzzle (see DailyChallenge): one deterministic
//              snippet per artist per day, 5 tries, a hint each miss, shareable.
//  • Endless — arcade multiple-choice: 3 lives, streak, high score.
// ---------------------------------------------------------------------------

const GOLD = '#FFD700';
const STORAGE_KEY = 'vaultgold_nametheleak_v1';

const START_LIVES = 3;
// Seconds each "hear more" step reveals, and points a correct guess earns there.
const REVEAL_SECONDS = [2, 4, 7, 11, 16];
const REVEAL_POINTS = [100, 80, 60, 40, 30];

interface Round {
  target: GameSong;
  options: GameSong[]; // includes target, shuffled
  reveal: number;      // index into REVEAL_SECONDS
  picked: GameSong | null;
  correct: boolean | null;
}

function buildRound(pool: GameSong[]): Round {
  const target = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffle(pool.filter(s => norm(s.title) !== norm(target.title))).slice(0, 3);
  const options = shuffle([target, ...distractors]);
  return { target, options, reveal: 0, picked: null, correct: null };
}

type Phase = 'select' | 'loading' | 'playing' | 'over';
type Mode = 'daily' | 'endless';

interface Best { score: number; streak: number }
function loadBest(): Best {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) { const p = JSON.parse(r); return { score: p.score || 0, streak: p.streak || 0 }; } } catch { /* ignore */ }
  return { score: 0, streak: 0 };
}
function saveBest(b: Best) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); } catch { /* ignore */ } }

export function SnippetGamePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('daily');
  const [dailySlug, setDailySlug] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>('select');
  const [slug, setSlug] = useState<string>('');
  const [pool, setPool] = useState<GameSong[]>([]);
  const [loadErr, setLoadErr] = useState<string>('');

  const [round, setRound] = useState<Round | null>(null);
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [runBestStreak, setRunBestStreak] = useState(0); // longest streak this run (survives the reset on a wrong guess)
  const [best, setBest] = useState<Best>(loadBest);

  // Refs let the audio error handler reach the current round + nextRound, which
  // are declared below (the audio hook has to be created before them).
  const roundRef = useRef<Round | null>(null);
  const nextRoundRef = useRef<() => void>(() => {});

  // If a round's clip can't be played (a zip behind an opaque link, a dead
  // file), roll a fresh round rather than leave the player guessing in silence.
  const { clipPlaying, buffering, loadClip, playLen, stopClip } = useSnippetAudio(() => {
    const r = roundRef.current;
    if (r && !r.picked) nextRoundRef.current();
  });

  // ---- endless flow --------------------------------------------------------
  const loadRoundClip = useCallback((r: Round) => { loadClip(r.target.url, { autoPlayLen: REVEAL_SECONDS[0] }); }, [loadClip]);

  const startGame = useCallback(async (chosen: string) => {
    setSlug(chosen);
    setPhase('loading');
    setLoadErr('');
    try {
      const p = await buildPool(chosen);
      if (p.length < 5) { setLoadErr('Not enough playable songs on this tracker to run the game. Try another artist.'); setPhase('select'); return; }
      setPool(p);
      setLives(START_LIVES); setScore(0); setStreak(0); setRunBestStreak(0);
      const r = buildRound(p);
      setRound(r);
      setPhase('playing');
      loadRoundClip(r);
    } catch {
      setLoadErr("Couldn't load this tracker's songs. Try again or pick another artist.");
      setPhase('select');
    }
  }, [loadRoundClip]);

  const nextRound = useCallback(() => {
    if (pool.length < 5) return;
    const r = buildRound(pool);
    setRound(r);
    loadRoundClip(r);
  }, [pool, loadRoundClip]);

  // Keep the audio-error handler pointed at the latest round + nextRound.
  roundRef.current = round;
  nextRoundRef.current = nextRound;

  const pick = useCallback((choice: GameSong) => {
    setRound(prev => {
      if (!prev || prev.picked) return prev;
      const correct = norm(choice.title) === norm(prev.target.title);
      stopClip();
      if (correct) {
        const pts = REVEAL_POINTS[Math.min(prev.reveal, REVEAL_POINTS.length - 1)] + streak * 5;
        setScore(s => s + pts);
        setStreak(s => { const ns = s + 1; setRunBestStreak(b => Math.max(b, ns)); return ns; });
      } else {
        setStreak(0);
        setLives(l => {
          const nl = l - 1;
          if (nl <= 0) setPhase('over'); // useEffect on phase==='over' persists the high score
          return nl;
        });
      }
      return { ...prev, picked: choice, correct };
    });
  }, [stopClip, streak]);

  const hearMore = useCallback(() => {
    setRound(prev => {
      if (!prev || prev.picked) return prev;
      const nextIdx = Math.min(prev.reveal + 1, REVEAL_SECONDS.length - 1);
      playLen(REVEAL_SECONDS[nextIdx]);
      return { ...prev, reveal: nextIdx };
    });
  }, [playLen]);

  useEffect(() => {
    if (phase === 'over') {
      setBest(b => { const nb = { score: Math.max(b.score, score), streak: Math.max(b.streak, runBestStreak) }; saveBest(nb); return nb; });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const cfg = slug ? getArtistConfig(slug) : undefined;
  const accent = cfg?.accentColor || GOLD;
  const artists = ARTIST_LIST.filter(c => !(c as any).hidden);

  const pickArtist = (chosen: string) => { if (mode === 'daily') { stopClip(); setDailySlug(chosen); } else startGame(chosen); };

  // ---- render --------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0b', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 14px 80px', paddingTop: 'max(20px, calc(env(safe-area-inset-top) + 8px))' }}>
      {!dailySlug && (
        <div style={{ width: '100%', maxWidth: 640, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={() => (phase === 'playing' || phase === 'over' ? (stopClip(), setPhase('select')) : navigate('/'))} style={backBtn}>
            ← {phase === 'playing' || phase === 'over' ? 'Quit' : 'Back to trackers'}
          </button>
          {mode === 'endless' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>BEST</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: GOLD }}>{best.score.toLocaleString()} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>· 🔥{best.streak}</span></div>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: 1, color: GOLD, textShadow: '0 0 24px rgba(255,215,0,0.35)' }}>NAME THAT LEAK</h1>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>Hear a snippet. Guess the track.</p>
      </div>

      {/* DAILY puzzle takes over the body once an artist is chosen. */}
      {dailySlug ? (
        <DailyChallenge slug={dailySlug} onExit={() => setDailySlug(null)} />
      ) : (
        <>
          {/* SELECT SCREEN */}
          {phase === 'select' && (
            <div style={{ width: '100%', maxWidth: 640 }}>
              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
                {(['daily', 'endless'] as Mode[]).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, letterSpacing: 0.5, background: mode === m ? GOLD : 'transparent', color: mode === m ? '#111' : 'rgba(255,255,255,0.6)' }}>
                    {m === 'daily' ? '🗓️ DAILY' : '♾️ ENDLESS'}
                  </button>
                ))}
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                {mode === 'daily'
                  ? 'One snippet per artist per day — 5 tries, a hint each miss. Same puzzle for everyone.'
                  : 'Endless rounds: 4 choices, 3 lives, build a high score.'}
              </p>

              {loadErr && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(217,75,61,0.12)', border: '1px solid rgba(217,75,61,0.5)', color: '#ffb4ac', fontSize: 13, marginBottom: 14 }}>{loadErr}</div>}

              {mode === 'endless' && (
                <button onClick={() => startGame(artists[Math.floor(Math.random() * artists.length)].slug)} style={{ ...randomBtn, borderColor: GOLD }}>
                  🎲 Random artist
                </button>
              )}
              <h2 style={sectionH}>{mode === 'daily' ? "Pick today's artist" : 'Or pick an artist'}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                {artists.map(c => (
                  <button key={c.slug} onClick={() => pickArtist(c.slug)} style={{ textAlign: 'left', cursor: 'pointer', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ArtistTile config={c} />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.getArtistName(undefined)}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{c.artistLabel}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LOADING */}
          {phase === 'loading' && (
            <div style={{ marginTop: 40, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>💿</div>
              <div style={{ fontSize: 14 }}>Loading the vault…</div>
            </div>
          )}

          {/* ENDLESS PLAYING */}
          {phase === 'playing' && round && (
            <div style={{ width: '100%', maxWidth: 480 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 18 }}>{'♥'.repeat(lives)}<span style={{ opacity: 0.25 }}>{'♥'.repeat(Math.max(0, START_LIVES - lives))}</span></div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{cfg?.getArtistName(undefined)}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>{score.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>🔥 {streak}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <button onClick={() => (clipPlaying ? stopClip() : playLen(REVEAL_SECONDS[round.reveal]))}
                  style={{ width: 84, height: 84, borderRadius: '50%', background: accent, color: '#111', border: 'none', fontSize: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 30px ${accent}55` }}>
                  {buffering ? '…' : clipPlaying ? '❚❚' : '▶'}
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                  {REVEAL_SECONDS.map((s, i) => (
                    <div key={i} style={{ width: 34, height: 6, borderRadius: 3, background: i <= round.reveal ? accent : 'rgba(255,255,255,0.14)' }} title={`${s}s`} />
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  {REVEAL_SECONDS[round.reveal]}s clip · worth {REVEAL_POINTS[round.reveal] + streak * 5} pts
                </div>
                {!round.picked && round.reveal < REVEAL_SECONDS.length - 1 && (
                  <button onClick={hearMore} style={hearMoreBtn}>＋ Hear more (−points)</button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {round.options.map(opt => {
                  const picked = round.picked && norm(round.picked.title) === norm(opt.title);
                  const isTarget = norm(opt.title) === norm(round.target.title);
                  let bg = 'rgba(255,255,255,0.05)';
                  let border = 'rgba(255,255,255,0.12)';
                  if (round.picked) {
                    if (isTarget) { bg = 'rgba(46,204,113,0.18)'; border = '#2ecc71'; }
                    else if (picked) { bg = 'rgba(217,75,61,0.18)'; border = '#d94b3d'; }
                  }
                  return (
                    <button key={opt.title + opt.era} disabled={!!round.picked} onClick={() => pick(opt)}
                      style={{ textAlign: 'left', padding: '13px 16px', borderRadius: 11, background: bg, border: `1px solid ${border}`, color: '#fff', cursor: round.picked ? 'default' : 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.title}</span>
                      {round.picked && isTarget && <span style={{ color: '#2ecc71', fontWeight: 800 }}>✓</span>}
                      {round.picked && picked && !isTarget && <span style={{ color: '#d94b3d', fontWeight: 800 }}>✕</span>}
                    </button>
                  );
                })}
              </div>

              {round.picked && (
                <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${round.correct ? 'rgba(46,204,113,0.4)' : 'rgba(217,75,61,0.4)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Cover url={round.target.image} accent={accent} size={52} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: round.correct ? '#2ecc71' : '#d94b3d' }}>{round.correct ? 'CORRECT' : 'NOPE — it was'}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{round.target.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{round.target.era}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => navigate(`/${slug}/album/${createSlug(round.target.era)}`)} style={{ ...smallBtn, flex: 1 }}>▶ Open on tracker</button>
                    <button onClick={nextRound} style={{ ...smallBtn, flex: 1, background: GOLD, color: '#111', border: 'none', fontWeight: 800 }}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ENDLESS GAME OVER */}
          {phase === 'over' && (
            <div style={{ width: '100%', maxWidth: 420, marginTop: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 13, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>GAME OVER</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: GOLD, margin: '4px 0' }}>{score.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>points · best streak this run 🔥{runBestStreak}</div>
              {score >= best.score && score > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: '#2ecc71', marginBottom: 14 }}>★ New high score!</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                <button onClick={() => startGame(slug)} style={playBtn}>↻ Play again</button>
                <button onClick={() => setPhase('select')} style={{ ...playBtn, background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`, boxShadow: 'none' }}>Pick artist</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---- cover tile (real art with fallback) ----------------------------------
function Cover({ url, accent, size }: { url?: string; accent: string; size: number }) {
  const [ok, setOk] = useState(true);
  if (url && ok) return <img src={url} onError={() => setOk(false)} style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }} />;
  return <div style={{ width: size, height: size, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>♪</div>;
}

// ---- artist picker tile: real photo, falling back to the accent letter -----
function ArtistTile({ config, size = 40 }: { config: ArtistConfig; size?: number }) {
  const [ok, setOk] = useState(true);
  if (config.artistPhotoUrl && ok) {
    return <img src={config.artistPhotoUrl} onError={() => setOk(false)} alt=""
      style={{ width: size, height: size, borderRadius: 9, objectFit: 'cover', objectPosition: config.photoObjectPosition ?? 'top center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }} />;
  }
  return <div style={{ width: size, height: size, borderRadius: 9, background: config.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, flexShrink: 0, color: '#111' }}>{config.cardLetter}</div>;
}

const backBtn: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 };
const sectionH: React.CSSProperties = { fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', margin: '18px 0 12px' };
const randomBtn: React.CSSProperties = { width: '100%', cursor: 'pointer', padding: '14px', borderRadius: 12, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.5)', color: GOLD, fontSize: 15, fontWeight: 800 };
const hearMoreBtn: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.75)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 };
const smallBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 9, padding: '10px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
const playBtn: React.CSSProperties = { background: GOLD, color: '#111', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 24px rgba(255,215,0,0.35)' };
