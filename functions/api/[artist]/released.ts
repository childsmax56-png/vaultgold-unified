import { parseCSV, csvResponse } from './_csvParser';

const VALID_TYPES = new Set(['Feature', 'Production', 'Single', 'Album Track', 'Mixtape Track', 'EP Track', 'Other']);

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const artist = (context.params as Record<string, string>).artist ?? "yzygold";
  const csvUrl = `${url.origin}/${artist}/data/released.csv`;

  const res = await fetch(csvUrl);
  if (!res.ok) return new Response('CSV not found', { status: 404 });

  const text = await res.text();
  const rows = parseCSV(text);

  const filtered = rows.filter(row => VALID_TYPES.has((row['Type'] || '').trim()));

  return csvResponse(filtered);
};
