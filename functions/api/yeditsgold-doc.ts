const DOC_ID = '1Yuqbwe3TwY0soU72M2PYTaN-NW1N3ooAgxHzlL4WsCM';
const DOC_TXT_URL = `https://docs.google.com/document/d/${DOC_ID}/export?format=txt`;

export const onRequestGet: PagesFunction = async () => {
  try {
    const res = await fetch(DOC_TXT_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch doc', status: res.status }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const text = await res.text();
    return new Response(JSON.stringify({ text }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch doc' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
