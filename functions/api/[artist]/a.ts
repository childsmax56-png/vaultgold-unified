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
  // kdotgold — merge duplicate eras (song rows use short name, section header uses versioned name)
  'Tu Pimp A Caterpillar': 'Tu Pimp A Caterpillar [V1]',
  'To Pimp A Butterfly [V2]': 'To Pimp A Butterfly',
  // vampgold
  'THC: The High Chronical$': 'The High Chronical$',
  'THC: The High Chronicals': 'The High Chronical$',
  'Ye - DONDA': 'Donda',
  // pushagold
  'Fear of God II: Let Us Pray': 'Fear of God II',
  'King Push – Darkest Before Dawn: The Prelude': 'Darkest Before Dawn',
  'King Push - Darkest Before Dawn: The Prelude': 'Darkest Before Dawn',
};

function mapEraName(name: string): string {
  return ERA_NAME_MAP[name] ?? name;
}

// Artists whose ERA_ORDER is exhaustive — unlisted rows (e.g. changelog footer) are dropped.
const EXHAUSTIVE_ERA_ORDER_ARTISTS = new Set(['yzygold', 'kdotgold']);

// Per-artist ERA_ORDER for artists whose CSVs have eras in the wrong order.
const ARTIST_ERA_ORDERS: Record<string, string[]> = {
  kdotgold: [
    'Y.H.N.I.C.',
    'Training Day',
    "No Sleep 'Til NYC",
    'C4',
    'The Kendrick Lamar EP',
    'Overly Dedicated',
    'Section.80',
    'Collaboration with J. Cole',
    'good kid, m.A.A.d city',
    'Tu Pimp A Caterpillar [V1]',
    'To Pimp A Butterfly',
    'untitled unmastered.',
    'DAMN.',
    'Black Panther: The Album',
    'Look Woman',
    'Everybody Sensitive [V1]',
    'Mr. Morale [V2]',
    'Mr. Morale [V3]',
    'Mr. Morale & The Big Steppers',
    'Drake vs. Kendrick Lamar',
    'GNX',
    'Rap Album',
    'Compton Cowboys',
    'Ongoing',
  ],
  uzigold: [
    'Purple Thoughtz',
    'Home Economic$',
    'The Real Uzi',
    '1017 vs. The World',
    'Luv Is Rage',
    'Lil Uzi Vert vs. The World',
    'Luv Is Rage 1.5',
    '2 Luv Is 2 Rage',
    'Barter 16',
    'The Perfect LUV Tape',
    'Luv Is Rage 2 [V1]',
    '16*29',
    'Lil Uzi Vert vs. The World 2 [V1]',
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
    'RED & WHITE',
    'METROOOO PINK',
    'ALL WHITE',
    'Forever Young',
    'Super gëëky',
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
    'Break Up To Make Up',
    'The Wash',
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
  xgold: [
    'CD MIxtape',
    'XXX (UNMASTERED)',
    'Ice Hotel',
    'e.motion',
    'THE NOBODYS',
    'The Fall',
    '♡ ʳ ᵃ ʳ ᵉ ♡',
    'Heartbreak Hotel',
    'Red Light District',
    'Members Only Vol. 1',
    'Members Only Vol. 2',
    'KIDS',
    'IWABOS',
    'Bad Vibes Forever',
    'Death Note',
    'Members Only Vol. 3',
    'Revenge',
    'UGLY',
    '17',
    'A GHETTO CHRISTMAS CAROL',
    'I Need Jesus',
    '?',
    'SKINS',
    'Members Only Vol. 4',
    '? (Deluxe)',
    'Bad Vibes Forever (2019)',
    'LOOK AT ME: THE ALBUM',
    'LOOK AT ME: XXXTENTACION',
    'Ongoing',
    'Unknown',
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
    // Some use 'Name\n(Join The Discord!)', others use 'Name\n(Check out the Tracker website!)', etc.
    const NAME_KEY = rows.length > 0
      ? (Object.keys(rows[0]).find(k => k === 'Name\n(Join The Discord!)')
        ?? Object.keys(rows[0]).find(k => k.startsWith('Name'))
        ?? Object.keys(rows[0]).find(k => k.startsWith('Title'))
        ?? 'Name')
      : 'Name';

    // Similarly detect the Notes column (wolfgold uses 'Info').
    const NOTES_KEY = rows.length > 0
      ? (Object.keys(rows[0]).find(k => k === 'Notes') ?? Object.keys(rows[0]).find(k => k.startsWith('Notes')) ?? Object.keys(rows[0]).find(k => k === 'Info') ?? 'Notes')
      : 'Notes';

    // Detect track length and available length columns (wolfgold uses 'Length' / 'Availability').
    const firstRowKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
    const TRACK_LENGTH_KEY = firstRowKeys.find(k => k === 'Track Length') ?? firstRowKeys.find(k => k === 'Length') ?? 'Track Length';
    const AVAIL_LENGTH_KEY = firstRowKeys.find(k => k === 'Available Length') ?? firstRowKeys.find(k => k === 'Availability') ?? firstRowKeys.find(k => k === 'Portion') ?? 'Available Length';

    const eras: Record<string, any> = {};

    // First pass: collect real era names from header rows (mapped to final names).
    // Header rows have newlines in the Era field (file counts). Stats rows also have newlines
    // but their Name field starts with a digit — skip those.
    const validEraNames = new Set<string>(); // raw CSV names AND mapped names
    for (const row of rows) {
      const eraField = row['Era'] ?? '';
      if (!eraField.includes('\n')) continue;
      const { name: eraName } = parseSongName(row[NAME_KEY] ?? '');
      if (eraName && !/^\d+\s/.test(eraName)) {
        validEraNames.add(eraName);
        // Also add the mapped name so song rows whose Era column uses the short name are found
        validEraNames.add(mapEraName(eraName));
      }
    }

    // Always supplement validEraNames with song-row era names so eras that have songs
    // but no header row (e.g. TrapMoneyBenny Collab, 004PF in vampgold) are not dropped.
    for (const row of rows) {
      const eraField = (row['Era'] ?? '').trim();
      if (eraField && !eraField.includes('\n') && !/^\d+/.test(eraField)) {
        validEraNames.add(eraField);
        validEraNames.add(mapEraName(eraField));
      }
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
          timeline: row[NOTES_KEY]?.trim() || undefined,
          fileInfo: eraField.split('\n').map((l: string) => l.trim()).filter(Boolean),
          data: { 'Unreleased Tracks': [] },
        };
      } else if (eraField && (validEraNames.has(eraField.trim()) || validEraNames.has(mapEraName(eraField.trim())))) {
        // Regular song row — only if it belongs to a known era.
        // Also accept rows whose era maps to a known name (e.g. "THC: The High Chronical$" → "The High Chronical$").
        const eraName = mapEraName(eraField.trim());
        if (!eras[eraName]) {
          eras[eraName] = { name: eraName, data: { 'Unreleased Tracks': [] } };
        }

        const { name, extra } = parseSongName(nameField);
        const links = (row['Link(s)'] ?? '').split('\n').map((l: string) => l.trim()).filter(Boolean);

        eras[eraName].data['Unreleased Tracks'].push({
          name,
          extra: extra ?? undefined,
          description: row[NOTES_KEY] ?? '',
          track_length: row[TRACK_LENGTH_KEY] ?? '',
          file_date: row['File Date'] ?? row['Origin'] ?? '',
          leak_date: row['Leak Date'] ?? '',
          available_length: row[AVAIL_LENGTH_KEY] ?? '',
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
      // Do NOT append extras for yzygold — ERA_ORDER is exhaustive and
      // any unlisted rows are changelog/footer garbage from the sheet.
    } else if (ARTIST_ERA_ORDERS[artist]) {
      // Apply artist-specific era ordering
      const eraOrder = ARTIST_ERA_ORDERS[artist];
      orderedEras = {};
      for (const name of eraOrder) {
        if (eras[name]) orderedEras[name] = eras[name];
      }
      // For exhaustive orders, drop unlisted rows (changelog/footer garbage).
      // For non-exhaustive orders, append any eras not in the order list.
      if (!EXHAUSTIVE_ERA_ORDER_ARTISTS.has(artist)) {
        for (const name of Object.keys(eras)) {
          if (!orderedEras[name]) orderedEras[name] = eras[name];
        }
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
