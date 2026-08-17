import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSlug } from './utils';
import { getArtistConfig } from './artists/registry';
import { useSnippetAudio } from './useSnippetAudio';
import { buildPool, dailyTarget, norm, todayStr, yesterdayStr, type GameSong } from './snippetGameData';

// ---------------------------------------------------------------------------
// VAULT HEARDLE — the daily puzzle.
// One deterministic snippet per artist per day (same for everyone, no backend).
// 5 tries; each miss extends the clip AND reveals the next hint. Search the real
// title list to guess. Shareable emoji grid + a per-artist daily streak.
// ---------------------------------------------------------------------------

const GOLD = '#FFD700';
const DAILY_KEY = 'vaultgold_daily_v1';
const MAX_TRIES = 5;
// Seconds of audio available at attempt index 0..4 (grows on each miss).
const DAILY_CLIP = [1, 2, 4, 8, 14];

interface Attempt { skip: boolean; title?: string; correct?: boolean }
interface DayState { guesses: Attempt[]; solved: boolean; done: boolean }
interface Streak { streak: number; max: number; last: string }
interface DailyStore { day: string; artists: Record<string, DayState>; streaks: Record<string, Streak> }

function loadStore(day: string): DailyStore {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      const p = JSON.parse(raw) as DailyStore;
      // Streaks persist across days; per-day guesses reset when the date rolls over.
      if (p.day !== day) return { day, artists: {}, streaks: p.streaks || {} };
      return { day, artists: p.artists || {}, streaks: p.streaks || {} };
    }
  } catch { /* ignore */ }
  return { day, artists: {}, streaks: {} };
}
function saveStore(s: DailyStore) { try { localStorage.setItem(DAILY_KEY, JSON.stringify(s)); } catch { /* ignore */ } }

function dateHint(t: GameSong): string {
  if (t.fileDate && t.leakDate) return `Recorded ${t.fileDate} · Leaked ${t.leakDate}`;
  if (t.leakDate) return `Leaked ${t.leakDate}`;
  if (t.fileDate) return `Recorded ${t.fileDate}`;
  return 'Unknown';
}
const trunc = (s: string, n = 140) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function prettyDate(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function DailyChallenge({ slug, onExit }: { slug: string; onExit: () => void }) {
  const navigate = useNavigate();
  const cfg = getArtistConfig(slug);
  const accent = cfg?.accentColor || GOLD;
  const artistName = cfg?.getArtistName(undefined) || slug;
  const day = useMemo(() => todayStr(), []);

  const { clipPlaying, buffering, loadClip, playLen, stopClip } = useSnippetAudio();

  const [pool, setPool] = useState<GameSong[] | null>(null);
  const [err, setErr] = useState('');
  const [target, setTarget] = useState<GameSong | null>(null);
  const [store, setStore] = useState<DailyStore>(() => loadStore(day));
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const state: DayState = store.artists[slug] || { guesses: [], solved: false, done: false };
  const attemptsUsed = state.guesses.length;
  const clipLen = state.done ? DAILY_CLIP[MAX_TRIES - 1] : DAILY_CLIP[Math.min(attemptsUsed, MAX_TRIES - 1)];

  // Load the tracker's songs, then resolve today's deterministic target + clip.
  useEffect(() => {
    let alive = true;
    setPool(null); setErr(''); setTarget(null);
    buildPool(slug)
      .then(p => {
        if (!alive) return;
        if (p.length < 1) { setErr('No playable songs on this tracker yet. Try another artist.'); return; }
        setPool(p);
        const { song, startFraction } = dailyTarget(p, slug, day);
        setTarget(song);
        const s = loadStore(day).artists[slug];
        const alreadyDone = s?.done;
        loadClip(song.url, { startFraction, autoPlayLen: alreadyDone ? undefined : DAILY_CLIP[Math.min(s?.guesses.length ?? 0, MAX_TRIES - 1)] });
      })
      .catch(() => { if (alive) setErr("Couldn't load this tracker. Try again or pick another artist."); });
    return () => { alive = false; stopClip(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, day]);

  const suggestions = useMemo(() => {
    if (!pool || !query.trim()) return [];
    const q = query.toLowerCase();
    const guessed = new Set(state.guesses.filter(g => g.title).map(g => norm(g.title!)));
    return pool.filter(s => s.title.toLowerCase().includes(q) && !guessed.has(norm(s.title))).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, query, attemptsUsed]);

  function commit(next: DayState) {
    setStore(prev => {
      const streaks = { ...prev.streaks };
      // Fold the result into the streak exactly once, when the day flips to done.
      if (next.done && !prev.artists[slug]?.done) {
        const cur = streaks[slug] || { streak: 0, max: 0, last: '' };
        if (cur.last !== day) {
          const streak = next.solved ? (cur.last === yesterdayStr(day) ? cur.streak + 1 : 1) : 0;
          streaks[slug] = { streak, max: Math.max(cur.max, streak), last: day };
        }
      }
      const updated: DailyStore = { day, artists: { ...prev.artists, [slug]: next }, streaks };
      saveStore(updated);
      return updated;
    });
  }

  function makeAttempt(a: Attempt) {
    if (state.done) return;
    const guesses = [...state.guesses, a];
    const solved = !!a.correct;
    const done = solved || guesses.length >= MAX_TRIES;
    commit({ guesses, solved, done });
    setQuery('');
    // Reveal the freshly-unlocked clip length (this runs inside a click gesture).
    const nextLen = done ? DAILY_CLIP[MAX_TRIES - 1] : DAILY_CLIP[Math.min(guesses.length, MAX_TRIES - 1)];
    playLen(nextLen);
  }

  const guess = (song: GameSong) => { if (target) makeAttempt({ skip: false, title: song.title, correct: norm(song.title) === norm(target.title) }); };
  const skip = () => makeAttempt({ skip: true });

  // Hints unlock one per attempt used (all revealed once the day is done).
  const revealed = state.done ? 4 : Math.min(attemptsUsed, 4);
  const hints = target ? [
    { label: 'Version / tag', value: target.version || 'No version tag' },
    { label: 'Date', value: dateHint(target) },
    { label: 'Era', value: target.era },
    { label: 'Worked on it', value: trunc(target.credits || target.notes || 'Unknown') },
  ] : [];

  function shareText(): string {
    const row = Array.from({ length: MAX_TRIES }, (_, i) => {
      const g = state.guesses[i];
      if (!g) return '⬜';
      return g.skip ? '⬛' : g.correct ? '🟩' : '🟥';
    }).join('');
    const scoreLabel = state.solved ? `${state.guesses.length}/${MAX_TRIES}` : `X/${MAX_TRIES}`;
    const st = store.streaks[slug];
    const streakLine = st && st.streak > 1 ? `\n🔥 ${st.streak} day streak` : '';
    return `🎧 Name That Leak — ${artistName}\n${prettyDate(day)} · ${scoreLabel}\n${row}${streakLine}\nunvaulted.cc/guess`;
  }
  function share() {
    const text = shareText();
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) { navigator.share({ text }).catch(() => {}); return; }
    navigator.clipboard?.writeText(text).then(done).catch(done);
  }

  const streak = store.streaks[slug];

  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={() => { stopClip(); onExit(); }} style={backBtn}>← Artists</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{artistName}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>DAILY · {prettyDate(day).toUpperCase()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, letterSpacing: 1, color: 'rgba(255,255,255,0.4)' }}>STREAK</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>🔥 {streak?.streak ?? 0}</div>
        </div>
      </div>

      {err && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(217,75,61,0.12)', border: '1px solid rgba(217,75,61,0.5)', color: '#ffb4ac', fontSize: 13 }}>{err}</div>}

      {!err && !target && (
        <div style={{ marginTop: 40, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>💿</div>
          <div style={{ fontSize: 14 }}>Loading today's puzzle…</div>
        </div>
      )}

      {target && (
        <>
          {/* Clip control */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button onClick={() => (clipPlaying ? stopClip() : playLen(clipLen))}
              style={{ width: 84, height: 84, borderRadius: '50%', background: accent, color: '#111', border: 'none', fontSize: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 30px ${accent}55` }}>
              {buffering ? '…' : clipPlaying ? '❚❚' : '▶'}
            </button>
            <div style={{ display: 'flex', gap: 4 }}>
              {DAILY_CLIP.map((s, i) => (
                <div key={i} style={{ width: 34, height: 6, borderRadius: 3, background: (state.done || i <= attemptsUsed) ? accent : 'rgba(255,255,255,0.14)' }} title={`${s}s`} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{clipLen}s clip · try {Math.min(attemptsUsed + 1, MAX_TRIES)} of {MAX_TRIES}</div>
          </div>

          {/* Guess rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {Array.from({ length: MAX_TRIES }).map((_, i) => {
              const g = state.guesses[i];
              const active = i === attemptsUsed && !state.done;
              return (
                <div key={i} style={{ minHeight: 40, borderRadius: 9, padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                  background: g ? (g.correct ? 'rgba(46,204,113,0.16)' : 'rgba(255,255,255,0.04)') : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${g ? (g.correct ? '#2ecc71' : g.skip ? 'rgba(255,255,255,0.12)' : 'rgba(217,75,61,0.4)') : active ? accent + '88' : 'rgba(255,255,255,0.07)'}`,
                  color: g ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                  {g ? (
                    <>
                      <span>{g.correct ? '🟩' : g.skip ? '⬛' : '🟥'}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.skip ? 'Skipped' : g.title}</span>
                    </>
                  ) : (
                    <span>{active ? 'Your guess…' : ''}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hints */}
          {revealed > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {hints.slice(0, revealed).map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '7px 12px', borderRadius: 8, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.18)' }}>
                  <span style={{ color: GOLD, fontWeight: 700, flexShrink: 0 }}>💡 {h.label}:</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>{h.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Input / result */}
          {!state.done ? (
            <div>
              <div style={{ position: 'relative' }}>
                <input value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && suggestions[0]) guess(suggestions[0]); }}
                  placeholder={`Search ${artistName} songs…`}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14, outline: 'none' }} />
                {suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#15151a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, overflow: 'hidden', zIndex: 5, boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
                    {suggestions.map(s => (
                      <button key={s.title + s.era} onClick={() => guess(s)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        {s.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={skip} style={{ ...smallBtn, flex: 1 }}>Skip (reveal hint) →</button>
                <button disabled={!suggestions[0]} onClick={() => suggestions[0] && guess(suggestions[0])} style={{ ...smallBtn, flex: 1, background: suggestions[0] ? GOLD : 'rgba(255,255,255,0.06)', color: suggestions[0] ? '#111' : 'rgba(255,255,255,0.35)', border: 'none', fontWeight: 800 }}>Guess</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${state.solved ? 'rgba(46,204,113,0.4)' : 'rgba(217,75,61,0.4)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Cover url={target.image} accent={accent} size={54} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: state.solved ? '#2ecc71' : '#d94b3d' }}>
                    {state.solved ? `SOLVED in ${state.guesses.length}/${MAX_TRIES}` : 'OUT OF TRIES — it was'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{target.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{target.era}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => navigate(`/${slug}/album/${createSlug(target.era)}`)} style={{ ...smallBtn, flex: 1 }}>▶ Open on tracker</button>
                <button onClick={share} style={{ ...smallBtn, flex: 1, background: GOLD, color: '#111', border: 'none', fontWeight: 800 }}>{copied ? '✓ Copied' : '📋 Share result'}</button>
              </div>
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                Come back tomorrow for a new {artistName} snippet · try another artist's daily above
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Cover({ url, accent, size }: { url?: string; accent: string; size: number }) {
  const [ok, setOk] = useState(true);
  if (url && ok) return <img src={url} onError={() => setOk(false)} style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }} />;
  return <div style={{ width: size, height: size, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>♪</div>;
}

const backBtn: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13 };
const smallBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 9, padding: '10px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700 };
