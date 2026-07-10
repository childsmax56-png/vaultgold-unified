import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ARTIST_LIST } from '../artists/registry';
import type { ArtistConfig } from '../artists/types';
import { createSlug } from '../utils';

// One recently-leaked track, as returned by /api/feed.
interface FeedItem {
  slug: string;
  era: string;
  name: string;
  extra?: string;
  leak_date: string;
  leak_ts: number;
  quality: string;
  url: string;
}

const CONFIG_BY_SLUG: Record<string, ArtistConfig> = Object.fromEntries(
  ARTIST_LIST.map(c => [c.slug, c])
);

const INITIAL_COUNT = 12;

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const day = 86_400_000;
  const days = Math.floor(diff / day);
  if (days < 0) return 'soon';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// Resolve an item to its artist config + browsable era name, or null if the era
// isn't one the site displays (same gate App.tsx uses: era ∈ ALBUM_RELEASE_DATES).
function resolve(item: FeedItem): { config: ArtistConfig; era: string } | null {
  const config = CONFIG_BY_SLUG[item.slug];
  if (!config) return null;
  const era = config.ERA_MAPPINGS?.[item.era] ?? item.era;
  if (!(era in config.ALBUM_RELEASE_DATES)) return null;
  return { config, era };
}

// Break up long runs of the same artist so a prolific tracker doesn't fill the
// whole visible slice — keeps the newest-first order but jumps ahead to a
// different artist once `maxRun` in a row would be exceeded. This makes a
// "cross-artist" feed actually feel cross-artist near the top.
function spreadByArtist(items: FeedItem[], maxRun = 2): FeedItem[] {
  const pending = [...items];
  const out: FeedItem[] = [];
  while (pending.length) {
    let idx = 0;
    const n = out.length;
    if (n >= maxRun && out.slice(n - maxRun).every(x => x.slug === out[n - 1].slug)) {
      const alt = pending.findIndex(x => x.slug !== out[n - 1].slug);
      if (alt !== -1) idx = alt;
    }
    out.push(pending.splice(idx, 1)[0]);
  }
  return out;
}

function FeedRow({ item }: { item: FeedItem }) {
  const navigate = useNavigate();
  const resolved = resolve(item);
  if (!resolved) return null;
  const { config, era } = resolved;
  const accent = config.accentColor;

  return (
    <button
      onClick={() => navigate(`/${config.slug}/album/${createSlug(era)}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
        background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.07)',
        transition: 'border-color 0.15s, transform 0.15s, background 0.15s',
        width: '100%', fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.borderColor = `${accent}66`;
        el.style.transform = 'translateY(-2px)';
        el.style.background = '#141414';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.borderColor = 'rgba(255,255,255,0.07)';
        el.style.transform = '';
        el.style.background = '#0f0f0f';
      }}
    >
      {config.logoUrl ? (
        <img
          src={config.logoUrl}
          alt={config.SITE_NAME}
          style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'contain', background: '#000', padding: 4, flexShrink: 0 }}
          onError={e => {
            const img = e.currentTarget;
            img.style.display = 'none';
            (img.nextElementSibling as HTMLElement).style.display = 'flex';
          }}
        />
      ) : null}
      <div style={{
        display: config.logoUrl ? 'none' : 'flex', width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        alignItems: 'center', justifyContent: 'center', background: `${accent}22`,
        color: accent, fontWeight: 900, fontSize: 15,
      }}>{config.cardLetter}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
          {item.extra && <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}> {item.extra}</span>}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ color: `${accent}cc`, fontWeight: 600 }}>{config.artistLabel}</span>
          {' · '}{era}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
          {relativeTime(item.leak_ts)}
        </span>
        {item.quality && (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: `${accent}aa`, background: `${accent}14`, borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap' }}>
            {item.quality}
          </span>
        )}
      </div>
    </button>
  );
}

export function WhatsNewFeed() {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/feed')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('feed failed')))
      .then((data: { items: FeedItem[] }) => { if (!cancelled) setItems(data.items ?? []); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  if (failed) return null;

  // Keep only items whose era the site can actually open, then spread artists.
  const browsable = spreadByArtist((items ?? []).filter(resolve));
  // Don't render the section at all once we know there's nothing to show.
  if (items && browsable.length === 0) return null;

  const visible = showAll ? browsable : browsable.slice(0, INITIAL_COUNT);

  return (
    <div style={{ width: '100%', maxWidth: 900, marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
          Recently Leaked
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>across all trackers</span>
      </div>

      {items === null ? (
        <div className="feed-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
          ))}
        </div>
      ) : (
        <>
          <div className="feed-grid">
            {visible.map((item, i) => (
              <FeedRow key={`${item.slug}-${item.era}-${item.name}-${i}`} item={item} />
            ))}
          </div>
          {browsable.length > INITIAL_COUNT && (
            <button
              onClick={() => setShowAll(v => !v)}
              style={{
                display: 'block', margin: '14px auto 0', padding: '9px 22px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600,
                letterSpacing: '0.04em', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.08)'; b.style.color = '#fff'; b.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.04)'; b.style.color = 'rgba(255,255,255,0.5)'; b.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {showAll ? 'Show less' : `Show ${browsable.length - INITIAL_COUNT} more`}
            </button>
          )}
        </>
      )}

      <style>{`
        .feed-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        @media (max-width: 600px) {
          .feed-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
