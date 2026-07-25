#!/usr/bin/env python3
"""Normalize the various artist groupbuy/fundraiser CSVs into one uniform schema:

    Year,YearTotal,Era,Name,Content,Price,Start,End,Type,Status,Link

- A special row with Year="TOTAL" carries the all-time total in YearTotal.
- Buy rows carry their grouping Year (from a year separator row, or parsed from a
  date), the year's total (YearTotal, if the source provided one), and the fields.
"""
import csv, os, re, sys

SRC = os.path.expanduser("~/Downloads/groupbuys")
DST = os.path.expanduser("~/Downloads/vaultgold-unified-main/public")

# source filename -> artist slug
FILES = {
    "Drake Tracker - Fundraisers.csv": "drizzygold",
    "Eminem Tracker - Groupbuys.csv": "shadygold",
    "XXXTENTACION Tracker - Groupbuys.csv": "xgold",
    "Playboi Carti Tracker [Official] - 💸 Buys.csv": "vampgold",
    "Updated Lil Uzi Vert Tracker - 💸 Buys.csv": "uzigold",
    "Kendrick Lamar Music Tracker - 🛍️ Groupbuys.csv": "kdotgold",
    "Mac Miller Tracker 2.0 - Fundraisers.csv": "macgold",
    "Destroy Lonely Tracker - 💵 Buys (WIP).csv": "lonelygold",
    "A$AP Rocky Tracker - 💵 Groupbuys.csv": "aapgold",
    "Creator Tracker - 💲 Fundraisers.csv": "wolfgold",
    "Juice WRLD Tracker - Fundraisers.csv": "juicegold",
    "Yeat Trackër - Fundraisers.csv": "twizzygold",
}

YEAR_RE = re.compile(r"\b(20[0-3]\d)\b")
TOTAL_RE = re.compile(r"total", re.I)


def clean(s):
    return (s or "").strip()


def is_bare_year(s):
    s = clean(s)
    return bool(re.fullmatch(r"20[0-3]\d", s))


def find_col(headers, *needles):
    # Match against only the FIRST LINE of each header — several sheets have long
    # multi-line header cells (e.g. a "Notes" header whose blurb mentions "link"),
    # which would otherwise cause false matches.
    for i, h in enumerate(headers):
        hl = (h or "").split("\n")[0].lower()
        for n in needles:
            if n in hl:
                return i
    return None


def parse_year(*cells):
    for c in cells:
        m = YEAR_RE.search(c or "")
        if m:
            return m.group(1)
    return ""


def normalize_generic(rows):
    """Handle the header-based families (everything except Juice)."""
    headers = rows[0]
    era_i = find_col(headers, "era")
    # Name: prefer an explicit "name"/"buy name"; else "main content".
    name_i = find_col(headers, "buy name")
    if name_i is None:
        name_i = next((i for i, h in enumerate(headers) if (h or "").strip().lower() == "name"), None)
    if name_i is None:
        name_i = find_col(headers, "main content")
    content_i = find_col(headers, "all content", "full content", "buy content", "notes")
    price_i = find_col(headers, "price")
    start_i = find_col(headers, "start")
    end_i = find_col(headers, "end")
    type_i = find_col(headers, "type")
    status_i = find_col(headers, "finished", "state", "status", "completed", "surfaced")
    link_i = find_col(headers, "link", "snippet", "server")

    def cell(row, i):
        return clean(row[i]) if (i is not None and i < len(row)) else ""

    out = []
    grand_total = ""
    cur_year = ""
    cur_year_total = ""

    for row in rows[1:]:
        if not any(clean(c) for c in row):
            continue
        era = cell(row, era_i)
        name = cell(row, name_i)
        content = cell(row, content_i)
        price = cell(row, price_i)

        joined = " ".join(clean(c) for c in row)

        # All-time total row (e.g. "Total spent All Time", "Total Paid: $x").
        if TOTAL_RE.search(era) or TOTAL_RE.search(name) or (TOTAL_RE.search(content) and not name):
            m = re.search(r"\$[\d,]+(?:\.\d+)?", joined)
            if m and not grand_total:
                grand_total = m.group(0)
            continue

        # "Upcoming Buys" section marker.
        if re.fullmatch(r"upcoming buys?", content.strip(), re.I) or re.fullmatch(r"upcoming buys?", name.strip(), re.I):
            cur_year = "Upcoming"
            cur_year_total = ""
            continue

        # Year separator row: a bare 4-digit year appears in era/name/content and
        # there is no real buy name.
        year_cell = next((c for c in (era, name, content) if is_bare_year(c)), "")
        if year_cell and not (name and not is_bare_year(name)):
            cur_year = year_cell
            cur_year_total = price
            continue

        if not name or name.upper() == "PLACEHOLDER":
            continue

        year = cur_year or parse_year(cell(row, start_i), cell(row, end_i))
        out.append({
            "Year": year or "Unknown",
            "YearTotal": cur_year_total if year == cur_year else "",
            "Era": era,
            "Name": name,
            "Content": content,
            "Price": price,
            "Start": cell(row, start_i),
            "End": cell(row, end_i),
            "Type": cell(row, type_i),
            "Status": cell(row, status_i),
            "Link": cell(row, link_i),
        })
    return out, grand_total


def normalize_juice(rows):
    """Juice WRLD: headers are a disclaimer; columns are positional.
    [1]=project [2]=era [3]=names [4]=info [5]=price [6]=start [7]=end [8]=finished [9]=surfaced
    Dates are embedded like 'Start Date\\nMarch 14, 2026.'"""
    out = []
    grand_total = ""
    # grand total lives in the header disclaimer price cell
    m = re.findall(r"\$?([\d,]{5,})", rows[0][5] if len(rows[0]) > 5 else "")
    if m:
        grand_total = "$" + m[0]

    def col(row, i):
        return clean(row[i]) if i < len(row) else ""

    def strip_label(s):
        # remove leading "Start Date\n" / "End Date\n" labels
        s = re.sub(r"^(start|end)\s*date\.?\s*", "", s, flags=re.I).strip()
        return s

    for row in rows[1:]:
        if not any(clean(c) for c in row):
            continue
        era = col(row, 2)
        # col[3] holds the buy name on line 1 and the bought songs on the rest.
        name_cell = col(row, 3)
        if not name_cell:
            continue
        name_lines = name_cell.split("\n")
        name = name_lines[0].strip()
        songs = "\n".join(l for l in name_lines[1:] if l.strip()).strip()
        start = strip_label(col(row, 6))
        end = strip_label(col(row, 7))
        info = col(row, 4)
        # Content = the bought songs, plus any additional-info note.
        content_parts = [p for p in (songs, info) if p and p != "-"]
        content = "\n".join(content_parts)
        price = col(row, 5)
        finished = col(row, 8)
        surfaced = col(row, 9)
        status_bits = []
        if finished:
            status_bits.append("Finished" if finished.upper() == "TRUE" else ("Unfinished" if finished.upper() == "FALSE" else finished))
        if surfaced.upper() == "TRUE":
            status_bits.append("Surfaced w/ OG")
        year = parse_year(start, end)
        out.append({
            "Year": year or "Unknown",
            "YearTotal": "",
            "Era": era,
            "Name": name,
            "Content": content,
            "Price": price,
            "Start": start,
            "End": end,
            "Type": col(row, 1),
            "Status": " / ".join(status_bits),
            "Link": "",
        })
    return out, grand_total


FIELDS = ["Year", "YearTotal", "Era", "Name", "Content", "Price", "Start", "End", "Type", "Status", "Link"]


def main():
    for fname, slug in FILES.items():
        path = os.path.join(SRC, fname)
        if not os.path.exists(path):
            print("MISSING", fname); continue
        with open(path, newline="", encoding="utf-8") as f:
            rows = list(csv.reader(f))
        if not rows:
            continue
        if slug == "juicegold":
            out, grand = normalize_juice(rows)
        else:
            out, grand = normalize_generic(rows)

        outdir = os.path.join(DST, slug, "data")
        os.makedirs(outdir, exist_ok=True)
        outpath = os.path.join(outdir, "groupbuys.csv")
        with open(outpath, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=FIELDS)
            w.writeheader()
            if grand:
                w.writerow({"Year": "TOTAL", "YearTotal": grand})
            for r in out:
                w.writerow(r)
        years = sorted({r["Year"] for r in out})
        print(f"{slug:12} {len(out):3} buys  total={grand or '-':>12}  years={years}")


if __name__ == "__main__":
    main()
