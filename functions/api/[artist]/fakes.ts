import { parseCSV, csvResponse } from './_csvParser';

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const artist = (context.params as Record<string, string>).artist ?? "yzygold";
  const csvUrl = `${url.origin}/${artist}/data/fakes.csv`;

  const res = await fetch(csvUrl);
  if (!res.ok) return new Response('CSV not found', { status: 404 });

  const text = await res.text();
  const rows = parseCSV(text);

  return csvResponse(rows);
};
