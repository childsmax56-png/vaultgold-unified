export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field);
        field = '';
      } else if (ch === '\n') {
        current.push(field);
        field = '';
        rows.push(current);
        current = [];
      } else if (ch !== '\r') {
        field += ch;
      }
    }
  }

  if (field || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  if (rows.length < 2) return [];

  // Some franktracker-template sheets (e.g. the pushagold music-videos tab) spill a
  // summary formula into the cell above the real header row, so the live CSV export
  // starts with a row like `&COUNTIFS(...),,,,` before the actual `Era,Name,…` header.
  // Skip any such leading formula-artifact rows so the true header row is used.
  const isFormulaArtifact = (row: string[]): boolean => {
    const first = (row[0] ?? '').trim();
    if (!first) return false;
    return /^[&=]/.test(first) || first.includes('COUNTIFS(') || first.includes('INDIRECT(');
  };
  let headerIdx = 0;
  while (headerIdx < rows.length - 1 && isFormulaArtifact(rows[headerIdx])) headerIdx++;

  const headers = rows[headerIdx];
  return rows.slice(headerIdx + 1)
    .filter(row => row.some(cell => cell.trim() !== ''))
    .map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] ?? '';
      });
      return obj;
    });
}

export function csvResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
