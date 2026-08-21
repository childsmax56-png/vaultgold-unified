#!/usr/bin/env python3
"""Transform the raw d4vd Google-Sheet CSV exports (~/Downloads/D4VD) into the
uniform tracker schema this app serves from public/d4vdgold/data/*.csv (+ the
Tracklists.json the Tracklists tab reads).

The source sheet already carries real download URLs in its Link(s) columns, so
this is a pure column-remap/normalise pass — no link recovery step needed.

Usage: python3 scripts/build-d4vdgold-csvs.py
"""
import csv, io, os, re, json

SRC = os.path.expanduser("~/Downloads/D4VD")
DST = os.path.join(os.path.dirname(__file__), "..", "public", "d4vdgold")
DATA = os.path.join(DST, "data")

FILES = {
    "unreleased": "d4vd Tracker - 🎵 Unreleased.csv",
    "released":   "d4vd Tracker - 🚧 🎧 Released (WIP) 🚧.csv",
    "stems":      "d4vd Tracker - Stems.csv",
    "tracklists": "d4vd Tracker - ⏩ Tracklists.csv",
    "buys":       "d4vd Tracker - 💰 Buys.csv",
    "fakes":      "d4vd Tracker - ❌ Fakes.csv",
}

# Song-row era values that are variants of a count-header era name; fold them in
# so the Music grid groups them under one era.
ERA_NORM = {
    "The Root Of It All": "The Root Of It All [V1]",
    "Petals To Thorns": "Petals To Thorns [V2]",
    "Marcescence": "WITHERED Deluxe: Marcescence",
}

RELEASED_VALID = {"Feature", "Production", "Single", "Album Track",
                  "Mixtape Track", "EP Track", "Other"}

MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun",
     "jul", "aug", "sep", "oct", "nov", "dec"], 1)}


def read_rows(key):
    with open(os.path.join(SRC, FILES[key]), newline="", encoding="utf-8") as f:
        return list(csv.reader(f))


def find_header(rows):
    for i, r in enumerate(rows):
        if r and r[0].strip() == "Era":
            return i
    return 0


def clean(s):
    return (s or "").strip()


def norm_era(e):
    e = clean(e)
    return ERA_NORM.get(e, e)


def is_count_header(cell):
    return "\n" in (cell or "")


def merge_notes(*parts):
    seen, out = set(), []
    for p in parts:
        p = clean(p)
        if p and p not in seen:
            seen.add(p)
            out.append(p)
    return "\n\n".join(out)


def write_csv(name, header, rows):
    os.makedirs(DATA, exist_ok=True)
    with open(os.path.join(DATA, name), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"  {name}: {len(rows)} rows")


def parse_date(s):
    """'Mar 17, 2024' -> (2024, 3, 17) sortable tuple; None if unparseable."""
    m = re.search(r"([A-Za-z]{3})[a-z]*\s+(\d{1,2}),?\s+(\d{4})", s or "")
    if m and m.group(1).lower() in MONTHS:
        return (int(m.group(3)), MONTHS[m.group(1).lower()], int(m.group(2)))
    m = re.search(r"\b(\d{4})\b", s or "")
    return (int(m.group(1)), 0, 0) if m else None


# ---------------------------------------------------------------- unreleased --
UNREL_HEADER = ["Era", "Name", "Notes", "Track Length", "File Date",
                "Leak Date", "Available Length", "Quality", "Link(s)"]


def build_unreleased():
    rows = read_rows("unreleased")
    hi = find_header(rows)
    out = []
    for r in rows[hi + 1:]:
        r = r + [""] * (9 - len(r))
        era, name, notes, tlen, leak, typ, avail, qual, link = r[:9]
        if is_count_header(era):
            era_name = clean(name).split("\n")[0]
            if not era_name:
                continue
            out.append([era, era_name, merge_notes(notes, typ), "", "", "", "", "", ""])
        else:
            if not clean(era) or not clean(name):
                continue
            out.append([norm_era(era), name, notes, tlen, "", leak, avail, qual, link])
    write_csv("unreleased.csv", UNREL_HEADER, out)
    return out


def build_recent(unrel):
    """Recent tab = leaked songs newest-first (top 60)."""
    dated = []
    for r in unrel:
        if is_count_header(r[0]):
            continue
        d = parse_date(r[5])
        if d:
            dated.append((d, r))
    dated.sort(key=lambda x: x[0], reverse=True)
    write_csv("recent.csv", UNREL_HEADER, [r for _, r in dated[:60]])


# ------------------------------------------------------------------ released --
def build_released():
    rows = read_rows("released")
    hi = find_header(rows)
    header = ["Era", "Name", "Notes", "Length", "Release Date", "Type", "Streaming", "Link(s)"]
    out = []
    for r in rows[hi + 1:]:
        r = r + [""] * (8 - len(r))
        era, name, notes, tlen, date, typ, stream, link = r[:8]
        if is_count_header(era):
            era_name = clean(name).split("\n")[0]
            if not era_name:
                continue
            out.append([era, era_name, merge_notes(notes, typ), "", "", "", "", ""])
        else:
            if not clean(era) or not clean(name):
                continue
            t = clean(typ)
            if t not in RELEASED_VALID:
                t = "Other"
            out.append([norm_era(era), name, notes, tlen, date, t, stream, link])
    write_csv("released.csv", header, out)


# --------------------------------------------------------------------- stems --
def build_stems():
    rows = read_rows("stems")
    hi = find_header(rows)
    header = ["Era", "Name", "Notes", "File Date", "Leak Date",
              "Full Length", "BPM", "Available Length", "Quality", "Link(s)"]
    out = []
    for r in rows[hi + 1:]:
        r = r + [""] * (7 - len(r))
        era, name, notes, typ, avail, qual, link = r[:7]
        # Drop pure section-label rows (Assets / Sessions / Instrumentals): no
        # type, availability, quality or link.
        if not any(clean(x) for x in (typ, avail, qual, link)):
            continue
        if not clean(name):
            continue
        out.append([norm_era(era), name, notes, "", "", "", "", avail, qual, link])
    write_csv("stems.csv", header, out)


# ---------------------------------------------------------------- tracklists --
def build_tracklists():
    rows = read_rows("tracklists")
    hi = find_header(rows)
    header = ["Era", "Name", "Tracklist", "Image", "Date Made", "Quality", "Source", "Link(s)"]
    out, jsonout = [], []
    for r in rows[hi + 1:]:
        r = r + [""] * (6 - len(r))
        era, name, notes, date, qual, source = r[:6]
        if not clean(name):
            continue
        era = norm_era(era)
        out.append([era, name, notes, "", date, qual, source, ""])
        tracks = []
        for line in (notes or "").split("\n"):
            m = re.match(r"\s*(\d+)[\.\)]\s+(.*\S)", line)
            if m:
                tracks.append({"num": "#" + m.group(1), "name": m.group(2).strip()})
        jsonout.append({
            "era": era, "name": clean(name), "date": clean(date),
            "quality": clean(qual), "source": clean(source),
            "links": [], "tracks": tracks,
        })
    write_csv("tracklists.csv", header, out)
    with open(os.path.join(DST, "Tracklists.json"), "w", encoding="utf-8") as f:
        json.dump(jsonout, f, indent=1, ensure_ascii=False)
    print(f"  Tracklists.json: {len(jsonout)} tracklists")


# -------------------------------------------------------------------- fakes --
def build_fakes():
    rows = read_rows("fakes")
    # Source has no header row; columns are:
    # Era, Name, Notes, _, _, _, Type(portion), Quality
    header = ["Era", "Name", "Notes", "Made By", "Type", "Currently Available", "Link(s)"]
    out = []
    for r in rows:
        r = r + [""] * (8 - len(r))
        era, name, notes = r[0], r[1], r[2]
        portion, qual = r[6], r[7]
        if not clean(name):
            continue
        avail = " ".join(x for x in (clean(portion), clean(qual)) if x)
        out.append([norm_era(era), name, notes, "", "", avail, ""])
    write_csv("fakes.csv", header, out)


# ---------------------------------------------------------------- groupbuys --
def build_groupbuys():
    rows = read_rows("buys")
    hi = find_header(rows)
    header = ["Year", "YearTotal", "Era", "Name", "Content",
              "Price", "Start", "End", "Type", "Status", "Link"]
    out = []
    for r in rows[hi + 1:]:
        r = r + [""] * (9 - len(r))
        era, contents, notes, start, end, price, typ, finished, link = r[:9]
        name = clean(contents).split("\n")[0]
        if not name:
            continue
        year = ""
        for c in (start, end):
            m = re.search(r"\b(20[0-3]\d)\b", c or "")
            if m:
                year = m.group(1)
                break
        content = merge_notes(contents, notes)
        out.append([year or "Unknown", "", clean(era), name, content,
                    clean(price), clean(start), clean(end), clean(typ),
                    clean(finished), clean(link)])
    write_csv("groupbuys.csv", header, out)


def main():
    print(f"Reading source CSVs from {SRC}")
    os.makedirs(DATA, exist_ok=True)
    unrel = build_unreleased()
    build_recent(unrel)
    build_released()
    build_stems()
    build_tracklists()
    build_fakes()
    build_groupbuys()
    print("Done. Commit public/d4vdgold/.")


if __name__ == "__main__":
    main()
