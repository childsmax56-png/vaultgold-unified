import { getCommunityTrackerCsv } from './_community';

// Live Google Sheet fallback for trackers that don't ship committed CSVs.
//
// Most trackers store their data as static CSVs under public/<slug>/data/*.csv
// (exported from their Google Sheet and committed to the repo). A few trackers
// are wired to read straight from the live Google Sheet instead — for those the
// endpoints fetch the sheet's CSV export at request time. This keeps the tracker
// working without a committed snapshot, at the cost of a live dependency on the
// sheet staying public.
//
// Keyed by artist slug → spreadsheet id + per-tab gid. Add a tab here only when
// that tab's gid exists in the source sheet.
interface SheetSource {
  sheetId: string;
  gids: Record<string, string>;
}

// gids are enumerated from a sheet's public /htmlview by scripts/build-sheet-tabs.mjs.
// Only add a tracker here after confirming its live export preserves working links
// (some trackers merge links from a separate source into their committed CSV and the
// live sheet stores them differently — those must stay committed-CSV-only).
const SHEET_SOURCES: Record<string, SheetSource> = {
  frankgold: {
    sheetId: '1wlztKH_bwoTDtMZFm8-lYqzZWLCGf-XqE-gea-nGR0Y',
    gids: {
      unreleased: '44489322',
      released: '1454863518',
      recent: '1122958563',
      tracklists: '1543259143',
      stems: '1010941390',
      'album-copies': '1324887433',
      'music-videos': '1257792866',
      fakes: '510511701',
      art: '1257812670',
    },
  },
  yzygold: {
    sheetId: '12nGHPPh5dVTfLuBLVQYzC3QgPxKfvp-jgCoNccvEasM',
    gids: {
      unreleased: '199908479',
      released: '1295931150',
      recent: '1385926980',
      stems: '495336364',
      'album-copies': '1297512832',
      art: '1659647236',
      'music-videos': '1115193942',
      misc: '70063278',
      tracklists: '1372270223',
      fakes: '61838480',
    },
  },
  pushagold: {
    sheetId: '19wsRrbQxQ7sz-LhkEYUlKIcVFvXdcG1hvT58zEY03sA',
    gids: {
      unreleased: '1932839414',
      released: '1139120082',
      recent: '2120181808',
      'album-copies': '2137086150',
      stems: '1685079869',
      art: '1413541492',
      tracklists: '425932540',
    },
  },
};

// Build the Google Sheets CSV export URL for an artist's tab, or null if the
// artist has no live-sheet source (or no gid for that tab).
export function sheetCsvUrl(artist: string, tab: string): string | null {
  const src = SHEET_SOURCES[artist];
  if (!src) return null;
  const gid = src.gids[tab];
  if (!gid) return null;
  return `https://docs.google.com/spreadsheets/d/${src.sheetId}/export?format=csv&gid=${gid}`;
}

// The SPA catch-all (_redirects /* /index.html 200) means missing static files
// return index.html with status 200 — detect real CSV text by its leading char.
const isCsvText = (t: string): boolean => !t.trimStart().startsWith('<');

// Resolve a tracker tab's CSV text: DB-backed community tracker first, then the
// live Google Sheet export (when a gid is configured for the tab), then the committed
// static file. Returns null when no source yields CSV. `env`/`request` are optional so
// official trackers work unchanged; `request` lets the creator/admin preview an
// unapproved tracker.
//
// The live sheet is tried BEFORE the committed CSV so editors' edits (new songs,
// renames, moved tabs) show up without re-running a build/commit — the committed CSV
// is a snapshot fallback used only when the sheet fetch fails or isn't configured.
// Responses are edge-cached 5 min (see csvResponse), so this doesn't hammer Google.
export async function fetchTrackerCsv(
  origin: string,
  artist: string,
  tab: string,
  env?: Env,
  request?: Request,
): Promise<string | null> {
  const community = await getCommunityTrackerCsv(env, artist, tab, request);
  if (community !== null) return community;

  // Live Google Sheet first, when this tab has a configured gid.
  const remote = sheetCsvUrl(artist, tab);
  if (remote) {
    try {
      const res = await fetch(remote, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const text = await res.text();
        if (isCsvText(text)) return text;
      }
    } catch {
      // fall through to the committed snapshot
    }
  }

  // Committed static CSV snapshot (fallback, or the sole source for unconfigured tabs).
  try {
    const res = await fetch(`${origin}/${artist}/data/${tab}.csv`);
    if (res.ok) {
      const text = await res.text();
      if (isCsvText(text)) return text;
    }
  } catch {
    // no committed CSV either
  }

  return null;
}
