import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { EmbedPlayerModal, detectEmbedService, type EmbedTarget } from './components/EmbedPlayerModal';

const DOC_URL = 'https://docs.google.com/document/d/1Yuqbwe3TwY0soU72M2PYTaN-NW1N3ooAgxHzlL4WsCM/edit?usp=sharing';
const ACCENT = '#FFD700';

const URL_RE = /https?:\/\/[^\s\])"]+/g;
const BULLET_RE = /^[•‣◦⁃∙•·\-\*]\s*/;
const NUM_RE = /^\d+[\.\)]\s*/;

interface Project {
  title: string;
  creator: string;
  links: string[];
  raw: string;
}

function parseDoc(text: string): { sections: { heading: string; projects: Project[] }[] } {
  const lines = text.split('\n').map(l => l.trimEnd());
  const sections: { heading: string; projects: Project[] }[] = [];
  let current: { heading: string; projects: Project[] } = { heading: '', projects: [] };

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const urls = trimmed.match(URL_RE) ?? [];
    const stripped = trimmed
      .replace(BULLET_RE, '')
      .replace(NUM_RE, '')
      .trim();

    if (urls.length === 0) {
      // Likely a section heading or plain text note
      if (stripped.length > 0 && stripped.length < 80) {
        if (current.projects.length > 0 || current.heading) {
          sections.push(current);
        }
        current = { heading: stripped, projects: [] };
      }
      continue;
    }

    // Line has at least one URL — treat as a project entry
    let rest = stripped;
    for (const u of urls) rest = rest.replace(u, '').trim();
    rest = rest.replace(/[-–—|,]+$/, '').replace(/^[-–—|,]+/, '').trim();

    // Try to split "Title - Creator" or "Title by Creator"
    let title = rest;
    let creator = '';
    const byMatch = rest.match(/^(.+?)\s+by\s+(.+)$/i);
    const dashMatch = rest.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (byMatch) {
      title = byMatch[1].trim();
      creator = byMatch[2].trim();
    } else if (dashMatch) {
      title = dashMatch[1].trim();
      creator = dashMatch[2].trim();
    }

    if (!title) title = urls[0];

    current.projects.push({ title, creator, links: urls, raw: trimmed });
  }

  if (current.projects.length > 0 || current.heading) {
    sections.push(current);
  }

  return { sections };
}

function ProjectCard({ project, onEmbed }: { project: Project; onEmbed: (target: EmbedTarget) => void }) {
  return (
    <div style={{
      background: '#111',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'border-color 0.2s, transform 0.15s',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = `${ACCENT}44`;
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'rgba(255,255,255,0.07)';
        el.style.transform = '';
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
          {project.title}
        </div>
        {project.creator && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
            {project.creator}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {project.links.map((url, i) => {
          const service = detectEmbedService(url);
          const label = project.links.length > 1 ? `Link ${i + 1}` : 'Play';
          if (service) {
            return (
              <button
                key={i}
                onClick={() => onEmbed({ service, url, label: project.title })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6,
                  background: `${ACCENT}12`, border: `1px solid ${ACCENT}33`,
                  color: ACCENT, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${ACCENT}22`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${ACCENT}12`; }}
              >
                ▶ {label}
              </button>
            );
          }
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <ExternalLink size={10} />
              {label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function YEditsGoldPage() {
  const navigate = useNavigate();
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [embedTarget, setEmbedTarget] = useState<EmbedTarget | null>(null);

  useEffect(() => {
    fetch('/api/yeditsgold-doc')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<{ text?: string; error?: string }>; })
      .then(d => { if (d.text) { setText(d.text); } else { setError(d.error ?? 'Unknown error'); } })
      .catch(e => setError(e.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const parsed = useMemo(() => text ? parseDoc(text) : { sections: [] }, [text]);

  const filtered = useMemo(() => {
    if (!search.trim()) return parsed.sections;
    const q = search.toLowerCase();
    return parsed.sections
      .map(s => ({
        ...s,
        projects: s.projects.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.creator.toLowerCase().includes(q)
        ),
      }))
      .filter(s => s.projects.length > 0);
  }, [parsed, search]);

  const totalCount = parsed.sections.reduce((n, s) => n + s.projects.length, 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      color: '#fff',
      fontFamily: "'Inter', system-ui, sans-serif",
      WebkitFontSmoothing: 'antialiased',
      padding: '24px 24px 64px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.12)'; b.style.color = '#fff'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.06)'; b.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>
                yedits<span style={{ color: ACCENT }}>gold</span>
              </h1>
              {totalCount > 0 && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                  {totalCount} projects
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              Community-made projects, sourced from the community doc
            </p>
          </div>
          <a
            href={DOC_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { const a = e.currentTarget; a.style.background = 'rgba(255,255,255,0.1)'; a.style.color = '#fff'; }}
            onMouseLeave={e => { const a = e.currentTarget; a.style.background = 'rgba(255,255,255,0.05)'; a.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <ExternalLink size={12} />
            View Doc
          </a>
        </div>

        {/* Search */}
        {!loading && !error && totalCount > 0 && (
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 10, marginBottom: 32,
              background: '#111', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = `${ACCENT}55`; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
        )}

        {/* States */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.4)', padding: '60px 0' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14 }}>Loading community projects…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, padding: '60px 0' }}>
            Failed to load: {error}
          </div>
        )}

        {/* Sections */}
        {!loading && !error && filtered.map((section, si) => (
          <div key={si} style={{ marginBottom: 40 }}>
            {section.heading && (
              <h2 style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)',
                marginBottom: 16,
              }}>
                {section.heading}
              </h2>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 10,
            }}>
              {section.projects.map((p, pi) => (
                <ProjectCard key={pi} project={p} onEmbed={setEmbedTarget} />
              ))}
            </div>
          </div>
        ))}

        <EmbedPlayerModal target={embedTarget} onClose={() => setEmbedTarget(null)} />

        {!loading && !error && filtered.length === 0 && search && (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '40px 0' }}>
            No results for "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
