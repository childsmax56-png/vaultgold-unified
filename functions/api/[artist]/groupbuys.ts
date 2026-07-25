import { parseCSV, csvResponse } from './_csvParser';

// Uniform schema produced by the groupbuys normalizer:
//   Year,YearTotal,Era,Name,Content,Price,Start,End,Type,Status,Link
// A row with Year="TOTAL" carries the all-time total in YearTotal.

interface Buy {
  era: string;
  name: string;
  content: string;
  price: string;
  start: string;
  end: string;
  type: string;
  status: string;
  link: string;
}

interface YearGroup {
  year: string;
  total: string;
  buys: Buy[];
}

// Upcoming first, then most-recent years, unknown last.
function yearRank(year: string): number {
  if (year === 'Upcoming') return Number.POSITIVE_INFINITY;
  if (year === 'Unknown' || !/^\d{4}$/.test(year)) return Number.NEGATIVE_INFINITY;
  return parseInt(year, 10);
}

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const artist = (context.params as Record<string, string>).artist ?? '';
    const csvUrl = `${url.origin}/${artist}/data/groupbuys.csv`;

    const res = await fetch(csvUrl);
    if (!res.ok) return csvResponse({ years: [], grandTotal: '' });

    const text = await res.text();
    // The SPA catch-all returns index.html (status 200) for missing static files.
    if (text.trimStart().startsWith('<')) return csvResponse({ years: [], grandTotal: '' });

    const rows = parseCSV(text);
    if (rows.length === 0) return csvResponse({ years: [], grandTotal: '' });

    let grandTotal = '';
    const groups: YearGroup[] = [];
    const byYear: Record<string, YearGroup> = {};

    for (const row of rows) {
      const year = (row['Year'] ?? '').trim();
      if (!year) continue;

      if (year === 'TOTAL') {
        grandTotal = (row['YearTotal'] ?? '').trim();
        continue;
      }

      const name = (row['Name'] ?? '').trim();
      if (!name) continue;

      let group = byYear[year];
      if (!group) {
        group = { year, total: '', buys: [] };
        byYear[year] = group;
        groups.push(group);
      }
      const yearTotal = (row['YearTotal'] ?? '').trim();
      if (yearTotal && !group.total) group.total = yearTotal;

      group.buys.push({
        era: (row['Era'] ?? '').trim(),
        name,
        content: (row['Content'] ?? '').trim(),
        price: (row['Price'] ?? '').trim(),
        start: (row['Start'] ?? '').trim(),
        end: (row['End'] ?? '').trim(),
        type: (row['Type'] ?? '').trim(),
        status: (row['Status'] ?? '').trim(),
        link: (row['Link'] ?? '').trim(),
      });
    }

    groups.sort((a, b) => yearRank(b.year) - yearRank(a.year));

    return csvResponse({ years: groups, grandTotal });
  } catch {
    return csvResponse({ years: [], grandTotal: '' });
  }
};
