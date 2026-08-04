// Bridge that lets the existing /api/{slug}/* tracker endpoints serve
// community-created trackers straight from D1, in the exact shapes the tracker
// view already consumes. Official trackers are unaffected — these helpers return
// null when the slug is not an approved community tracker, and callers fall
// through to their normal static-CSV / Google-Sheet path.

interface CommunityTracker {
  id: string;
  slug: string;
  name: string;
  status: string;
}

interface EraRow {
  id: string;
  name: string;
  image: string | null;
  release_date: string | null;
  description: string | null;
  sort_order: number;
}

interface SongRow {
  era_id: string;
  category: string;
  name: string;
  extra: string | null;
  notes: string | null;
  credited: string | null;
  quality: string | null;
  available_length: string | null;
  track_length: string | null;
  leak_date: string | null;
  file_date: string | null;
  url: string | null;
  tab: string;
  sort_order: number;
}

// Return the approved community tracker for this slug, or null. Only 'approved'
// trackers resolve publicly through the data endpoints.
export async function getCommunityTracker(db: D1Database | undefined, slug: string): Promise<CommunityTracker | null> {
  if (!db) return null;
  try {
    return (await db
      .prepare(`SELECT id, slug, name, status FROM community_trackers WHERE slug = ? AND status = 'approved'`)
      .bind(slug)
      .first()) as CommunityTracker | null;
  } catch {
    // Table may not exist yet (no community trackers created) — treat as "not community".
    return null;
  }
}

// Build the { name, tabs, current_tab, eras } payload for /api/{slug}/a from the
// tracker's eras and their unreleased-tab songs.
export async function buildCommunityTrackerData(db: D1Database, tracker: CommunityTracker) {
  const eras = ((await db.prepare(
    'SELECT * FROM community_eras WHERE tracker_id = ? ORDER BY sort_order, name'
  ).bind(tracker.id).all()).results ?? []) as EraRow[];
  const songs = ((await db.prepare(
    `SELECT * FROM community_songs WHERE tracker_id = ? AND tab = 'unreleased' ORDER BY sort_order, name`
  ).bind(tracker.id).all()).results ?? []) as SongRow[];

  const songsByEra = new Map<string, SongRow[]>();
  for (const s of songs) {
    const arr = songsByEra.get(s.era_id) ?? [];
    arr.push(s);
    songsByEra.set(s.era_id, arr);
  }

  const erasOut: Record<string, unknown> = {};
  for (const era of eras) {
    const data: Record<string, unknown[]> = {};
    for (const s of songsByEra.get(era.id) ?? []) {
      const category = s.category?.trim() || 'Unreleased Tracks';
      (data[category] ??= []).push({
        name: s.name,
        extra: s.extra ?? undefined,
        description: [s.notes, s.credited ? `Credits: ${s.credited}` : '']
          .filter(Boolean).join('\n') || '',
        track_length: s.track_length ?? '',
        file_date: s.file_date ?? '',
        leak_date: s.leak_date ?? '',
        available_length: s.available_length ?? '',
        quality: s.quality ?? '',
        url: s.url ?? '',
        urls: s.url ? [s.url] : [],
      });
    }
    if (Object.keys(data).length === 0) data['Unreleased Tracks'] = [];
    erasOut[era.name] = {
      name: era.name,
      image: era.image ?? undefined,
      timeline: era.description ?? undefined,
      data,
    };
  }

  return { name: tracker.name, tabs: ['eras'], current_tab: 'eras', eras: erasOut };
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

const VALID_RELEASED_TYPES = new Set(['Feature', 'Production', 'Single', 'Album Track', 'Mixtape Track', 'EP Track', 'Other']);

// Produce CSV text (same headers the [artist] parsers expect) for a non-unreleased
// tab of a community tracker, or null when the slug isn't an approved community
// tracker. The /a endpoint builds its eras JSON directly and never calls this.
export async function getCommunityTrackerCsv(
  db: D1Database | undefined,
  slug: string,
  tab: string,
): Promise<string | null> {
  const tracker = await getCommunityTracker(db, slug);
  if (!tracker || !db) return null;

  const eras = ((await db.prepare(
    'SELECT id, name FROM community_eras WHERE tracker_id = ? ORDER BY sort_order, name'
  ).bind(tracker.id).all()).results ?? []) as { id: string; name: string }[];
  const eraName = new Map(eras.map((e) => [e.id, e.name]));

  const songs = ((await db.prepare(
    'SELECT * FROM community_songs WHERE tracker_id = ? AND tab = ? ORDER BY sort_order, name'
  ).bind(tracker.id, tab).all()).results ?? []) as SongRow[];

  const header = ['Era', 'Name', 'Notes', 'Type', 'Track Length', 'Leak Date', 'File Date', 'Available Length', 'Quality', 'Link(s)'];
  const lines = [header.join(',')];
  for (const s of songs) {
    const type = VALID_RELEASED_TYPES.has((s.category || '').trim()) ? s.category!.trim() : 'Other';
    const cells = [
      eraName.get(s.era_id) ?? '',
      s.name,
      [s.notes, s.credited ? `Credits: ${s.credited}` : ''].filter(Boolean).join('\n'),
      type,
      s.track_length ?? '',
      s.leak_date ?? '',
      s.file_date ?? '',
      s.available_length ?? '',
      s.quality ?? '',
      s.url ?? '',
    ];
    lines.push(cells.map((c) => csvEscape(String(c ?? ''))).join(','));
  }
  return lines.join('\n');
}
