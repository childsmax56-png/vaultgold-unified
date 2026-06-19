/**
 * build-juice-csvs.mjs
 * Fetches Juice WRLD tracker sheet tabs via gviz (metadata only, no links),
 * merges URLs from juice-links.csv, and writes static CSVs to
 * public/juicegold/data/ so the tracker shows working links.
 *
 * Usage: node scripts/build-juice-csvs.mjs
 *   Optional env: JUICE_LINKS_CSV=/path/to/juice-links.csv (default: ~/Downloads/juice-links.csv)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const SHEET_ID = '1tD3ytt5wPx4zfcefXi5ATeYhIiDaugWjMS46nZrP568';
const gviz = (gid) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;

const TABS = [
  { name: 'unreleased', gid: '0',          outFile: 'unreleased.csv' },
  { name: 'recent',     gid: '1558109614', outFile: 'recent.csv' },
  { name: 'released',   gid: '2006526517', outFile: 'released.csv' },
  { name: 'fakes',      gid: '127937350',  outFile: 'fakes.csv' },
];

const LINKS_CSV = process.env.JUICE_LINKS_CSV
  || join(homedir(), 'Downloads', 'juice-links.csv');

const OUT_DIR = new URL('../public/juicegold/data/', import.meta.url).pathname;

// ---------------------------------------------------------------------------
// CSV parser — handles quoted fields with embedded newlines/commas/quotes
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = '';
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const nx = text[i + 1];
    if (inQ) {
      if (ch === '"' && nx === '"') { field += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQ = true; }
      else if (ch === ',') { cur.push(field); field = ''; }
      else if (ch === '\n') { cur.push(field); field = ''; rows.push(cur); cur = []; }
      else if (ch !== '\r') { field += ch; }
    }
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter(r => r.some(c => c.trim()))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i] ?? ''; });
      return obj;
    });
}

// ---------------------------------------------------------------------------
// CSV serialiser — always quotes every field for safety
// ---------------------------------------------------------------------------
function toCSV(headers, rows) {
  const q = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const lines = [headers.map(q).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => q(row[h] ?? '')).join(','));
  }
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Normalise a raw gviz header to a canonical column key
// gviz lowercases and may embed newlines in multi-line headers.
// ---------------------------------------------------------------------------
function normaliseHeader(raw) {
  // Remove newlines, collapse whitespace, keep as-is for matching
  return raw.replace(/\n/g, ' ').trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Find the first key in a row object whose normalised form starts with prefix
// ---------------------------------------------------------------------------
function findKey(row, ...prefixes) {
  const keys = Object.keys(row);
  for (const prefix of prefixes) {
    const found = keys.find(k => normaliseHeader(k).startsWith(prefix));
    if (found) return found;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Normalise era name for matching (lowercase, collapse spaces)
// ---------------------------------------------------------------------------
function normEra(s) { return s.toLowerCase().replace(/\s+/g, ' ').trim(); }
function normName(s) { return s.split('\n')[0].toLowerCase().trim(); }

// ---------------------------------------------------------------------------
// Load juice-links.csv → Map<tabName, Map<era+name, string[]>>
// ---------------------------------------------------------------------------
function loadLinksCSV(path) {
  if (!existsSync(path)) {
    console.error(`Links CSV not found: ${path}`);
    process.exit(1);
  }
  const rows = parseCSV(readFileSync(path, 'utf8'));
  // tab → era|name → [url, ...]
  const index = new Map();
  for (const row of rows) {
    const tab  = (row['Tab']  || '').trim().toLowerCase();
    const era  = normEra(row['Era']  || '');
    const name = normName(row['Name'] || '');
    const url  = (row['URL']  || '').trim();
    if (!tab || !name || !url) continue;
    if (!index.has(tab)) index.set(tab, new Map());
    const tabMap = index.get(tab);
    const key = era + '\x00' + name;
    if (!tabMap.has(key)) tabMap.set(key, []);
    tabMap.get(key).push(url);
  }
  return index;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`Loading links from: ${LINKS_CSV}`);
  const linksIndex = loadLinksCSV(LINKS_CSV);

  // Print coverage per tab
  for (const [tab, m] of linksIndex) {
    console.log(`  ${tab}: ${m.size} songs with links (${[...m.values()].reduce((a,b)=>a+b.length,0)} URLs)`);
  }

  for (const tabDef of TABS) {
    const url = gviz(tabDef.gid);
    console.log(`\nFetching ${tabDef.name} (gid=${tabDef.gid})...`);
    const res = await fetch(url);
    if (!res.ok) { console.error(`  Failed: ${res.status}`); continue; }
    const rawText = await res.text();

    const rows = parseCSV(rawText);
    if (!rows.length) { console.log(`  Empty, skipping`); continue; }

    // Detect key columns from first non-empty row
    const sample = rows[0];
    const eraKey  = findKey(sample, 'era');
    const nameKey = findKey(sample, 'name');
    const notesKey = findKey(sample, 'notes');
    const lenKey   = findKey(sample, 'track length');
    const fileDateKey = findKey(sample, 'file\ndate', 'file date');
    const leakDateKey = findKey(sample, 'leak\ndate', 'leak date');
    const availKey = findKey(sample, 'available length');
    const qualKey  = findKey(sample, 'quality');

    console.log(`  Detected columns: era=${eraKey} name=${nameKey} notes=${notesKey} len=${lenKey} file=${fileDateKey} leak=${leakDateKey} avail=${availKey} qual=${qualKey}`);

    if (!eraKey || !nameKey) { console.error(`  Missing era/name columns, skipping`); continue; }

    const tabLinks = linksIndex.get(tabDef.name) || new Map();

    // Build output rows
    const outHeaders = ['Era', 'Name', 'Notes', 'Track Length', 'File Date', 'Leak Date', 'Available Length', 'Quality', 'Link(s)'];
    const outRows = [];
    let linked = 0;
    let total = 0;

    for (const row of rows) {
      const era  = (row[eraKey]  || '').trim();
      const rawName = (row[nameKey] || '').trim();
      const songName = rawName.split('\n')[0].trim();

      // Skip era header rows (era cell contains newlines — file count summaries)
      if (era.includes('\n')) continue;
      if (!era || !songName) continue;

      // Look up links — try matching on this tab first, then fall back to recent/unreleased
      const key = normEra(era) + '\x00' + normName(rawName);
      let urls = tabLinks.get(key) || [];

      // Also check by just name (some eras are spelled slightly differently in links CSV)
      if (!urls.length) {
        for (const [k, v] of tabLinks) {
          if (k.endsWith('\x00' + normName(rawName))) { urls = v; break; }
        }
      }

      total++;
      if (urls.length) linked++;

      outRows.push({
        'Era':              era,
        'Name':             rawName,
        'Notes':            (notesKey ? row[notesKey] : '') || '',
        'Track Length':     (lenKey   ? row[lenKey]   : '') || '',
        'File Date':        (fileDateKey ? row[fileDateKey] : '') || '',
        'Leak Date':        (leakDateKey ? row[leakDateKey] : '') || '',
        'Available Length': (availKey ? row[availKey] : '') || '',
        'Quality':          (qualKey  ? row[qualKey]  : '') || '',
        'Link(s)':          urls.join('\n'),
      });
    }

    const outPath = join(OUT_DIR, tabDef.outFile);
    writeFileSync(outPath, toCSV(outHeaders, outRows), 'utf8');
    console.log(`  ✓ Wrote ${outRows.length} rows to ${outPath} (${linked}/${total} with links)`);
  }

  console.log('\nDone! Commit public/juicegold/data/ to deploy.');
}

main().catch(err => { console.error(err); process.exit(1); });
