import {
  CUSTOM_IMAGES,
  ALBUM_RELEASE_DATES,
  ALBUM_DESCRIPTIONS,
  ALBUM_SONG_COUNTS,
  SITE_NAME,
  SITE_URL,
} from '../src/artist.config';

// Replicates src/utils.tsx createSlug — keep in sync if that changes
function createSlug(name: string): string {
  return encodeURIComponent(
    name
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
  );
}

function findEraBySlug(rawSlug: string) {
  const target = decodeURIComponent(rawSlug).toLowerCase();
  for (const eraName of Object.keys(ALBUM_RELEASE_DATES)) {
    const slug = createSlug(eraName);
    if (decodeURIComponent(slug).toLowerCase() === target) {
      return {
        name: eraName,
        image: CUSTOM_IMAGES[eraName] || '',
        date: ALBUM_RELEASE_DATES[eraName],
        description: ALBUM_DESCRIPTIONS[eraName] || '',
        songCount: ALBUM_SONG_COUNTS[eraName] ?? null,
      };
    }
  }
  return null;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildDescription(era: NonNullable<ReturnType<typeof findEraBySlug>>): string {
  const parts: string[] = [];

  if (era.songCount !== null) parts.push(`${era.songCount} songs`);
  if (era.date && !era.date.includes('????')) parts.push(era.date);

  const statLine = parts.join(' · ');
  const descText = era.description.trim();

  if (statLine && descText) {
    const remaining = 280 - statLine.length - 3; // 3 for " · "
    const excerpt = remaining > 40
      ? descText.slice(0, remaining).trimEnd() + (descText.length > remaining ? '…' : '')
      : '';
    return excerpt ? `${statLine} · ${excerpt}` : statLine;
  }

  if (statLine) return statLine;

  return descText.slice(0, 280).trimEnd() + (descText.length > 280 ? '…' : '');
}

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname;

  let rawSlug: string | null = null;
  if (path.startsWith('/album/')) rawSlug = path.slice('/album/'.length);
  else if (path.startsWith('/related/')) rawSlug = path.slice('/related/'.length);

  if (!rawSlug) return context.next();

  const era = findEraBySlug(rawSlug);
  if (!era) return context.next();

  const response = await context.next();
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return response;

  const html = await response.text();

  const title = `${era.name} | ${SITE_NAME}`;
  const desc = buildDescription(era);
  const imageUrl = era.image;
  const pageUrl = `${SITE_URL.replace(/\/$/, '')}${path}`;

  const twitterTags = `
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${esc(imageUrl)}" />`;

  const modified = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,   `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${esc(desc)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/,   `$1${esc(imageUrl)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,     `$1${esc(pageUrl)}$2`)
    .replace('</head>', `  <meta property="og:site_name" content="${esc(SITE_NAME)}" />${twitterTags}\n</head>`);

  return new Response(modified, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'content-type': 'text/html;charset=UTF-8',
    },
  });
};
