import { parseCSV, csvResponse } from './_csvParser';
import { fetchTrackerCsv } from './_sheets';

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const artist = (context.params as Record<string, string>).artist ?? "yzygold";

  const text = await fetchTrackerCsv(url.origin, artist, 'stems', (context.env as Env).DB);
  if (text === null) return new Response('CSV not found', { status: 404 });

  const rows = parseCSV(text);

  return csvResponse(rows);
};
