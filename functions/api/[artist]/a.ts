import { parseCSV, csvResponse } from './_csvParser';

function parseSongName(raw: string): { name: string; extra: string | undefined } {
  const newline = raw.indexOf('\n');
  if (newline === -1) return { name: raw.trim(), extra: undefined };
  const name = raw.substring(0, newline).trim();
  const extra = raw.substring(newline).trim().replace(/^\n+/, '') || undefined;
  return { name, extra };
}

// App.tsx ERA_MAPPINGS renames these keys after receiving the response, which moves them
// to the end of the object and breaks ordering. Return the final names directly so
// App.tsx sees them as already-mapped and leaves them in place.
const ERA_NAME_MAP: Record<string, string> = {
  'Turbo Grafx 16': 'Turbo Grafix 16',
  'Turbo Grafx-16': 'Turbo Grafix 16',
  'KIDS SEE GHOSTS': 'KIDS SEE GHOSTS',
  'KIDS SEE GHOST': 'KIDS SEE GHOSTS',
  'KIDSSEEGHOSTS': 'KIDS SEE GHOSTS',
  'Kids See Ghosts': 'KIDS SEE GHOSTS',
  'Donda [V1]': 'DONDA [V1]',
  'Bully': 'BULLY [V1]',
  'BULLY': 'BULLY [V1]',
  // dregold
  "The Chronic II: A New World Odor (Poppa's Got A Brand New Funk)": 'The Chronic II',
  'The Chronic II: A New World Odor': 'The Chronic II',
  'N.W.A. Reunion Album': 'N.W.A. Reunion',
  // pushagold
  'Fear of God II: Let Us Pray': 'Fear of God II',
  'King Push – Darkest Before Dawn: The Prelude': 'Darkest Before Dawn',
  'King Push - Darkest Before Dawn: The Prelude': 'Darkest Before Dawn',
};

function mapEraName(name: string): string {
  return ERA_NAME_MAP[name] ?? name;
}

// Per-artist ERA_ORDER for artists whose CSVs have eras in the wrong order.
const ARTIST_ERA_ORDERS: Record<string, string[]> = {
  uzigold: [
    'Purple Thoughtz',
    'The Real Uzi',
    '1017 vs. The World',
    'Luv Is Rage',
    'Luv Is Rage 1.5',
    'Lil Uzi Vert vs. The World',
    '2 Luv Is 2 Rage',
    'Barter 16',
    '16*29',
    'Lil Uzi Vert vs. The World 2 [V1]',
    'The Perfect LUV Tape',
    'Luv Is Rage 2 [V1]',
    'Luv Is Rage 2 [V2]',
    'Too Fast',
    'Tsunami Island',
    'Eternal Atake [V1]',
    'Eternal Atake [V2]',
    'Eternal Atake [V3]',
    'Baby Pluto Era',
    'Pluto x Baby Pluto',
    'Luv Is Rage 3 [V2]',
    'Eternal Atake 2',
    'Pink Tape [V1]',
    'Pink Tape [V2]',
    'Pink Tape [V3]',
    'Home Economic$',
    'METROOOO PINK',
    'ALL WHITE',
    'Forever Young',
    'RED & WHITE',
    'Super geeky',
    'Super geëky',
    'DPONTHEBEAT Vol 5',
    'W.H.2.U',
    'LP 5',
    'Ongoing',
  ],
  twizzygold: [
    'Lyfëstyle [V1]',
    'Different Creature',
    "I'm So Me",
    'Wake Up Call',
    'Up 2 Më [V1]',
    'Up 2 Më [V3]',
    'Alivë',
    'Hold Ön',
    '2093',
    'A DANGEROUS LYFE [V1]',
    'ADL [V2]',
    'ADL [V3]',
    'ADL',
    'ADL (Deluxe)',
    'AftërLyfe',
    'AftërLyfe (Deluxe)',
    '2 Alivë',
    '2 Alivë (Geëk Pack)',
    'DANGEROUS SUMMER',
    'Deep Blue $trips',
    'LYFESTYLE [V2]',
    'LYFESTYLE',
    'LYFESTYLE DIGITAL DELUXE',
    'Lyfë',
    'Trëndi',
    '4L',
    'Up 2 Më',
    'We Us',
    'DC2',
    'Elegance',
    'Super Sonic',
    'Super geëky',
    'Collaboration with 2kthagoon',
    'Collaboration with SwagHollywood',
    'Ongoing',
  ],
  dregold: [
    'N.W.A. And The Posse',
    'Straight Outta Compton',
    "100 Miles & Runnin'",
    'efiL4zaggiN',
    'The Chronic',
    'Helter Skelter',
    'The Chronic II',
    '2001',
    'The Wash',
    'Break Up To Make Up',
    'N.W.A. Reunion',
    'Detox [V1]',
    'Detox [V2]',
    'Detox [V3]',
    'Planets [V1]',
    'Detox [V4]',
    'Detox [V5]',
    'Compton',
    'Detox [V6]',
    'JESUS IS KING: The Dr. Dre Version',
    'Detox [V7]',
    'Missionary',
    'LP4',
    'Planets [V2]',
    'Ongoing',
  ],
};

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const artist = (context.params as Record<string, string>).artist ?? "yzygold";

    // Try unreleased.csv first, fall back to unreleased-main.csv (e.g. dregold).
    // Note: the SPA catch-all (_redirects /* /index.html 200) means missing static
    // files return index.html with status 200 — detect HTML by content-type or prefix.
    const isCsvText = (t: string) => !t.trimStart().startsWith('<');

    let text: string;
    const csvUrl = `${url.origin}/${artist}/data/unreleased.csv`;
    const res = await fetch(csvUrl);
    const resText = res.ok ? await res.text() : '';
    if (res.ok && isCsvText(resText)) {
      text = resText;
    } else {
      const fallbackUrl = `${url.origin}/${artist}/data/unreleased-main.csv`;
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) return new Response('CSV not found', { status: 404 });
      const fallbackText = await fallbackRes.text();
      if (!isCsvText(fallbackText)) return new Response('CSV not found', { status: 404 });
      text = fallbackText;
    }

    const rows = parseCSV(text);

    // Detect which column holds the song/era name — different CSVs use different headers.
    const NAME_KEY = rows.length > 0 && 'Name\n(Join The Discord!)' in rows[0]
      ? 'Name\n(Join The Discord!)'
      : 'Name';

    const eras: Record<string, any> = {};

    // First pass: collect real era names from header rows (mapped to final names).
    // Header rows have newlines in the Era field (file counts). Stats rows also have newlines
    // but their Name field starts with a digit — skip those.
    const validEraNames = new Set<string>(); // raw CSV names
    for (const row of rows) {
      const eraField = row['Era'] ?? '';
      if (!eraField.includes('\n')) continue;
      const { name: eraName } = parseSongName(row[NAME_KEY] ?? '');
      if (eraName && !/^\d+\s/.test(eraName)) validEraNames.add(eraName);
    }

    // Second pass: build eras and songs, ignoring anything outside known eras.
    for (const row of rows) {
      const eraField = row['Era'] ?? '';
      const nameField = row[NAME_KEY] ?? '';

      if (eraField.includes('\n')) {
        // Era header row
        const { name: rawName, extra } = parseSongName(nameField);
        if (!rawName || !validEraNames.has(rawName)) continue;
        const eraName = mapEraName(rawName);

        eras[eraName] = {
          name: eraName,
          extra: extra ?? undefined,
          timeline: row['Notes']?.trim() || undefined,
          fileInfo: eraField.split('\n').map((l: string) => l.trim()).filter(Boolean),
          data: { 'Unreleased Tracks': [] },
        };
      } else if (eraField && validEraNames.has(eraField.trim())) {
        // Regular song row — only if it belongs to a known era
        const eraName = mapEraName(eraField.trim());
        if (!eras[eraName]) {
          eras[eraName] = { name: eraName, data: { 'Unreleased Tracks': [] } };
        }

        const { name, extra } = parseSongName(nameField);
        const links = (row['Link(s)'] ?? '').split('\n').map((l: string) => l.trim()).filter(Boolean);

        eras[eraName].data['Unreleased Tracks'].push({
          name,
          extra: extra ?? undefined,
          description: row['Notes'] ?? '',
          track_length: row['Track Length'] ?? '',
          file_date: row['File Date'] ?? row['Origin'] ?? '',
          leak_date: row['Leak Date'] ?? '',
          available_length: row['Available Length'] ?? row['Portion'] ?? '',
          quality: row['Quality'] ?? '',
          url: links[0] ?? '',
          urls: links,
        });
      }
    }

    let orderedEras: Record<string, any>;

    if (artist === 'yzygold') {
      // Wolves has no CSV entry — seed it so the order list can place it correctly.
      // App.tsx will only overwrite this if it's missing, so pre-seeding keeps the position.
      if (!eras['Wolves']) {
        eras['Wolves'] = {
          name: 'Wolves',
          extra: '(Collaboration with Drake) (New Abu Dhabi, Calabasas Is The New Abu Dhabi)',
          data: { 'Main Tracks': [], 'Snippets & Leaks': [] },
        };
      }

      const ERA_ORDER = [
        'Before The College Dropout',
        'The College Dropout',
        'Late Registration',
        'Graduation',
        '808s & Heartbreak',
        'Good Ass Job',
        'My Beautiful Dark Twisted Fantasy',
        'Watch The Throne',
        'Cruel Summer',
        'Thank God For Drugs',
        'Yeezus',
        'Cruel Winter [V1]',
        'Yeezus 2',
        'So Help Me God',
        'SWISH',
        'The Life Of Pablo',
        'Cruel Winter [V2]',
        'Turbo Grafix 16',
        'Wolves',
        'LOVE EVERYONE',
        'DAYTONA',
        'ye',
        'KIDS SEE GHOSTS',
        'NASIR',
        'K.T.S.E.',
        'Good Ass Job (2018)',
        'Yandhi [V1]',
        'Yandhi [V2]',
        'JESUS IS KING',
        "God's Country",
        'JESUS IS KING: The Dr. Dre Version',
        'DONDA [V1]',
        'Donda [V2]',
        'Donda [V3]',
        'Donda 2',
        'WAR',
        'YEBU',
        'Bad Bitch Playbook',
        'VULTURES 1',
        'VULTURES 2',
        'The Elementary School Dropout',
        'VULTURES 3',
        'BULLY [V1]',
        'CUCK',
        'DONDA 2 (2025)',
        'NEVER STOP',
        'IN A PERFECT WORLD',
        'BULLY [V2]',
        'Ongoing',
      ];

      orderedEras = {};
      for (const name of ERA_ORDER) {
        if (eras[name]) orderedEras[name] = eras[name];
      }
      // Append any eras from the CSV not in the order list
      for (const name of Object.keys(eras)) {
        if (!orderedEras[name]) orderedEras[name] = eras[name];
      }
    } else if (ARTIST_ERA_ORDERS[artist]) {
      // Apply artist-specific era ordering
      const eraOrder = ARTIST_ERA_ORDERS[artist];
      orderedEras = {};
      for (const name of eraOrder) {
        if (eras[name]) orderedEras[name] = eras[name];
      }
      // Append any eras from the CSV not in the order list
      for (const name of Object.keys(eras)) {
        if (!orderedEras[name]) orderedEras[name] = eras[name];
      }
    } else {
      // For other artists, preserve CSV row order as-is.
      orderedEras = eras;
    }

    const trackerData = {
      name: 'YZY Gold',
      tabs: ['eras'],
      current_tab: 'eras',
      eras: orderedEras,
    };

    return csvResponse(trackerData);
  } catch (err) {
    return new Response('Failed to build tracker data', { status: 500 });
  }
};
