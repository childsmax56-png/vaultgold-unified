import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface CommunityTracker {
  slug: string;
  name: string;
  description: string | null;
  accent_color: string | null;
  logo_url: string | null;
  artist_photo_url: string | null;
  username: string;
}

export function CommunityPage() {
  const [trackers, setTrackers] = useState<CommunityTracker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/community/list')
      .then((r) => r.json())
      .then((d) => setTrackers(d.trackers ?? []))
      .catch(() => setTrackers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 18px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Link to="/" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 14 }}>← Home</Link>
          <Link to="/create-tracker" style={{ background: '#2563eb', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 14 }}>
            + Create a tracker
          </Link>
        </div>

        <h1 style={{ fontSize: 30, margin: '10px 0 4px' }}>Community Trackers</h1>
        <p style={{ color: '#94a3b8', marginBottom: 26 }}>
          Trackers built by the community, reviewed and approved by moderators.
        </p>

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading…</p>
        ) : trackers.length === 0 ? (
          <div style={{ background: '#111827', border: '1px dashed #1f2937', borderRadius: 14, padding: 40, textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 16px' }}>No community trackers yet. Be the first!</p>
            <Link to="/create-tracker" style={{ background: '#2563eb', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600 }}>
              Build one →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 18 }}>
            {trackers.map((t) => (
              <Link
                key={t.slug}
                to={`/${t.slug}/`}
                style={{
                  textDecoration: 'none', color: 'inherit', background: '#111827',
                  border: '1px solid #1f2937', borderRadius: 14, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', transition: 'transform 0.1s',
                }}
              >
                <div style={{ aspectRatio: '1 / 1', background: t.accent_color || '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.logo_url || t.artist_photo_url ? (
                    <img src={t.logo_url || t.artist_photo_url || ''} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 44, fontWeight: 800, color: '#fff', opacity: 0.85 }}>{t.name[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div style={{ padding: '12px 13px' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>by {t.username}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
