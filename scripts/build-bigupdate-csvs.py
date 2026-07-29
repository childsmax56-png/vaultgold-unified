#!/usr/bin/env python3
"""Mass-import the trackers dropped in "~/Downloads/big update".

Each source folder is a Google-Sheets export (one CSV per tab). This script
transforms every folder into the uniform schema the app serves from
public/<slug>/data/*.csv (+ Tracklists.json), auto-derives the era list, and
generates src/artists/<slug>.ts. It is header-driven: source column order and
naming vary per tracker, so columns are matched by header keyword rather than
by fixed position.

Usage: python3 scripts/build-bigupdate-csvs.py
Then wire the generated configs into src/artists/registry.ts.
"""
import csv, io, os, re, json

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC_ROOT = os.path.expanduser("~/Downloads/big update")

# folder -> (slug, artist display name, accent hex, card letter, short label)
ARTISTS = {
    "SZA":               ("szagold",        "SZA",              "#7c3aed", "S", "SZA"),
    "alliyah":           ("aaliyahgold",    "Aaliyah",          "#b91c1c", "A", "Aaliyah"),
    "ant clemons":       ("antclemonsgold", "Ant Clemons",      "#0ea5e9", "A", "Ant Clemons"),
    "bad bunny":         ("badbunnygold",   "Bad Bunny",        "#16a34a", "B", "Bad Bunny"),
    "chance the rapper": ("chancegold",     "Chance the Rapper","#f59e0b", "C", "Chance the Rapper"),
    "childish gambino":  ("gambinogold",    "Childish Gambino", "#dc2626", "C", "Childish Gambino"),
    "chris brown":       ("chrisbrowngold", "Chris Brown",      "#2563eb", "C", "Chris Brown"),
    "coldplay":          ("coldplaygold",   "Coldplay",         "#eab308", "C", "Coldplay"),
    "daft punk":         ("daftpunkgold",   "Daft Punk",        "#f97316", "D", "Daft Punk"),
    "danny brown":       ("dannybrowngold", "Danny Brown",      "#84cc16", "D", "Danny Brown"),
    "dochii":            ("doechiigold",    "Doechii",          "#a16207", "D", "Doechii"),
    "freddie gibbs":     ("gibbsgold",      "Freddie Gibbs",    "#7c2d12", "F", "Freddie Gibbs"),
    "gunna":             ("gunnagold",      "Gunna",            "#c026d3", "G", "Gunna"),
    "ice cube":          ("icecubegold",    "Ice Cube",         "#0891b2", "I", "Ice Cube"),
    "james blake":       ("jamesblakegold", "James Blake",      "#475569", "J", "James Blake"),
    "layurn hill":       ("lauryngold",     "Ms. Lauryn Hill",  "#ca8a04", "L", "Lauryn Hill"),
    "nas":               ("nasgold",        "Nas",              "#991b1b", "N", "Nas"),
    "steveie lacy":      ("stevelacygold",  "Steve Lacy",       "#059669", "S", "Steve Lacy"),
    "trippie red":       ("trippiegold",    "Trippie Redd",     "#e11d48", "T", "Trippie Redd"),
    "ty dolla $ign":     ("tydollagold",    "Ty Dolla $ign",    "#9333ea", "T", "Ty Dolla $ign"),
    "usher":             ("ushergold",      "Usher",            "#1d4ed8", "U", "Usher"),
    "weekend":           ("weekndgold",     "The Weeknd",       "#b91c1c", "W", "The Weeknd"),
    "westside gun":      ("westsidegold",   "Westside Gunn",    "#525252", "W", "Westside Gunn"),
    "wu tang":           ("wutanggold",     "Wu-Tang Clan",     "#facc15", "W", "Wu-Tang Clan"),
}

RELEASED_VALID = {"Feature", "Production", "Single", "Album Track",
                  "Mixtape Track", "EP Track", "Other"}
MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun",
     "jul", "aug", "sep", "oct", "nov", "dec"], 1)}


# ------------------------------------------------------------------ helpers --
def clean(s):
    return (s or "").strip()


def is_count_header(cell):
    """Era-header rows carry a newline-separated file-count block in col 0."""
    c = cell or ""
    return "\n" in c and re.search(r"\b(Full|Tagged|Partial|OG|Snippet|Unavailable)\b", c, re.I)


def merge_notes(*parts):
    seen, out = set(), []
    for p in parts:
        p = clean(p)
        if p and p not in seen:
            seen.add(p)
            out.append(p)
    return "\n\n".join(out)


def parse_date(s):
    m = re.search(r"([A-Za-z]{3})[a-z]*\s+(\d{1,2}),?\s+(\d{4})", s or "")
    if m and m.group(1).lower() in MONTHS:
        return (int(m.group(3)), MONTHS[m.group(1).lower()], int(m.group(2)))
    m = re.search(r"\b(\d{4})\b", s or "")
    return (int(m.group(1)), 0, 0) if m else None


def read_rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.reader(f))


def _first_line(c):
    return clean(c).split("\n")[0].strip().lower()


def find_header(rows):
    """Header row = first row whose cell (first line) is Name/Title/Content.

    Header cells often carry a parenthetical second line ('Name\\n(Check out...)'),
    and some sheets prepend disclaimer rows, so match on the cell's first line.
    """
    for i, r in enumerate(rows):
        firsts = {_first_line(c) for c in r}
        if firsts & {"name", "title", "main content", "full content"}:
            return i
    return 0


def col(headers, *keywords, exclude=()):
    """First column index whose header contains all keywords and no exclude."""
    for i, h in enumerate(headers):
        hl = clean(h).lower()
        if all(k in hl for k in keywords) and not any(x in hl for x in exclude):
            return i
    return None


def cell(row, idx):
    if idx is None or idx >= len(row):
        return ""
    return clean(row[idx])


def canon_tab(tabname):
    """Map a source tab title to a canonical output tab, or None to skip."""
    t = tabname.lower()
    if "individual artists" in t or "outdated" in t or "lost tapes" in t:
        return None
    if any(x in t for x in ("hoax", "miscredit", "bootleg", "fake")):
        return "fakes"
    if any(x in t for x in ("unreleased", "off-streaming", "not on streaming")):
        return "unreleased"
    if t.strip() == "daft punk tracker":
        return "unreleased"
    if "mixtape" in t or "released" in t:
        return "released"
    if "stem" in t:
        return "stems"
    if "tracklist" in t:
        return "tracklists"
    if "album cop" in t:
        return "album-copies"
    if "music video" in t:
        return "music-videos"
    if t.strip() == "media":
        return None
    if "recent" in t:
        return "recent"
    if "art" in t:
        return "art"
    if "misc" in t:
        return "misc"
    if "buy" in t:
        return "groupbuys"
    return None


def write_csv(data_dir, name, header, rows):
    os.makedirs(data_dir, exist_ok=True)
    with open(os.path.join(data_dir, name), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"    {name}: {len(rows)} rows")


# --------------------------------------------------------------- transforms --
UNREL_HEADER = ["Era", "Name", "Notes", "Track Length", "File Date",
                "Leak Date", "Available Length", "Quality", "Link(s)"]


def build_unreleased(rows):
    hi = find_header(rows)
    h = rows[hi]
    ci = {
        "name": (col(h, "name") or col(h, "title")),
        "notes": col(h, "note") or col(h, "info"),
        "tlen": col(h, "track", "length") or col(h, "length", exclude=("available", "full")),
        "file": col(h, "file", "date") or col(h, "obtained"),
        "leak": col(h, "leak", "date"),
        "avail": col(h, "available") or col(h, "portion") or col(h, "availability"),
        "qual": col(h, "quality"),
        "link": col(h, "link") or col(h, "source"),
    }
    out = []
    for r in rows[hi + 1:]:
        era0 = r[0] if r else ""
        if is_count_header(era0):
            era_name = cell(r, ci["name"]).split("\n")[0]
            if not era_name:
                continue
            out.append([era0, era_name, "", "", "", "", "", "", ""])
        else:
            era = clean(era0)
            name = cell(r, ci["name"])
            if not era or not name:
                continue
            out.append([era, name, cell(r, ci["notes"]), cell(r, ci["tlen"]),
                        cell(r, ci["file"]), cell(r, ci["leak"]),
                        cell(r, ci["avail"]), cell(r, ci["qual"]),
                        cell(r, ci["link"])])
    return out


def build_recent_from_unrel(unrel):
    dated = []
    for r in unrel:
        if is_count_header(r[0]):
            continue
        d = parse_date(r[5])
        if d:
            dated.append((d, r))
    dated.sort(key=lambda x: x[0], reverse=True)
    return [r for _, r in dated[:60]]


def build_released(rows):
    hi = find_header(rows)
    h = rows[hi]
    ci = {
        "name": (col(h, "name") or col(h, "title")),
        "notes": col(h, "note") or col(h, "info"),
        "tlen": col(h, "length"),
        "date": col(h, "date"),
        "type": col(h, "type"),
        "stream": col(h, "stream"),
        "link": col(h, "link") or col(h, "source"),
    }
    header = ["Era", "Name", "Notes", "Length", "Release Date", "Type", "Streaming", "Link(s)"]
    out = []
    for r in rows[hi + 1:]:
        era0 = r[0] if r else ""
        if is_count_header(era0):
            era_name = cell(r, ci["name"]).split("\n")[0]
            if era_name:
                out.append([era0, era_name, "", "", "", "", "", ""])
            continue
        era = clean(era0)
        name = cell(r, ci["name"])
        if not era or not name:
            continue
        t = cell(r, ci["type"])
        if t == "Track":
            t = "Album Track"
        if t not in RELEASED_VALID:
            t = "Other"
        out.append([era, name, cell(r, ci["notes"]), cell(r, ci["tlen"]),
                    cell(r, ci["date"]), t, cell(r, ci["stream"]),
                    cell(r, ci["link"])])
    return out


def build_stems(rows):
    hi = find_header(rows)
    h = rows[hi]
    ci = {
        "name": (col(h, "name") or col(h, "title")),
        "notes": col(h, "note") or col(h, "info"),
        "file": col(h, "file", "date"),
        "leak": col(h, "leak", "date"),
        "full": col(h, "full", "length") or col(h, "length", exclude=("available",)),
        "bpm": col(h, "bpm"),
        "avail": col(h, "available") or col(h, "portion"),
        "qual": col(h, "quality"),
        "link": col(h, "link") or col(h, "source"),
    }
    header = ["Era", "Name", "Notes", "File Date", "Leak Date",
              "Full Length", "BPM", "Available Length", "Quality", "Link(s)"]
    out = []
    for r in rows[hi + 1:]:
        name = cell(r, ci["name"])
        if not name:
            continue
        avail, qual, link = cell(r, ci["avail"]), cell(r, ci["qual"]), cell(r, ci["link"])
        if not any((avail, qual, link)):
            continue
        out.append([clean(r[0]) if r else "", name, cell(r, ci["notes"]),
                    cell(r, ci["file"]), cell(r, ci["leak"]), cell(r, ci["full"]),
                    cell(r, ci["bpm"]), avail, qual, link])
    return out


def build_tracklists(rows, dst_dir):
    hi = find_header(rows)
    h = rows[hi]
    ci = {
        "name": (col(h, "name") or col(h, "title")),
        "tl": col(h, "tracklist"),
        "date": col(h, "date"),
        "qual": col(h, "quality"),
        "source": col(h, "source"),
        "link": col(h, "link"),
    }
    header = ["Era", "Name", "Tracklist", "Image", "Date Made", "Quality", "Source", "Link(s)"]
    out, jsonout = [], []
    for r in rows[hi + 1:]:
        name = cell(r, ci["name"])
        if not name:
            continue
        era = clean(r[0]) if r else ""
        tl = cell(r, ci["tl"])
        date, qual, source = cell(r, ci["date"]), cell(r, ci["qual"]), cell(r, ci["source"])
        out.append([era, name, tl, "", date, qual, source, ""])
        tracks = []
        for line in tl.split("\n"):
            m = re.match(r"\s*#?(\d+)[\.\)]\s+(.*\S)", line)
            if m:
                tracks.append({"num": "#" + m.group(1), "name": m.group(2).strip()})
        jsonout.append({"era": era, "name": name, "date": date, "quality": qual,
                        "source": source, "links": [], "tracks": tracks})
    with open(os.path.join(dst_dir, "Tracklists.json"), "w", encoding="utf-8") as f:
        json.dump(jsonout, f, indent=1, ensure_ascii=False)
    print(f"    Tracklists.json: {len(jsonout)} tracklists")
    return header, out


def build_fakes(rows):
    hi = find_header(rows)
    h = rows[hi]
    ci = {
        "name": (col(h, "name") or col(h, "title")),
        "notes": col(h, "note") or col(h, "info"),
        "made": col(h, "made") or col(h, "designer") or col(h, "by"),
        "type": col(h, "type"),
        "avail": col(h, "available") or col(h, "portion"),
        "qual": col(h, "quality"),
        "link": col(h, "link") or col(h, "source"),
    }
    header = ["Era", "Name", "Notes", "Made By", "Type", "Currently Available", "Link(s)"]
    out = []
    for r in rows[hi + 1:]:
        name = cell(r, ci["name"])
        if not name:
            continue
        avail = " ".join(x for x in (cell(r, ci["avail"]), cell(r, ci["qual"])) if x)
        out.append([clean(r[0]) if r else "", name, cell(r, ci["notes"]),
                    cell(r, ci["made"]), cell(r, ci["type"]), avail, cell(r, ci["link"])])
    return out


def build_groupbuys(rows):
    hi = find_header(rows)
    h = rows[hi]
    ci = {
        "content": (col(h, "main", "content") or col(h, "full", "content")
                    or col(h, "content") or (col(h, "name") or col(h, "title"))),
        "allcontent": col(h, "all", "content"),
        "price": col(h, "price"),
        "start": col(h, "start"),
        "end": col(h, "end"),
        "type": col(h, "type"),
        "status": (col(h, "finished") or col(h, "state") or col(h, "status")),
        "link": col(h, "link") or col(h, "snippet") or col(h, "source"),
    }
    header = ["Year", "YearTotal", "Era", "Name", "Content",
              "Price", "Start", "End", "Type", "Status", "Link"]
    out = []
    for r in rows[hi + 1:]:
        era = clean(r[0]) if r else ""
        content = cell(r, ci["content"])
        name = content.split("\n")[0]
        if not name:
            continue
        start, end = cell(r, ci["start"]), cell(r, ci["end"])
        year = ""
        for c in (end, start):
            m = re.search(r"\b(19|20)\d{2}\b", c)
            if m:
                year = m.group(0)
                break
        full = merge_notes(content, cell(r, ci["allcontent"]))
        out.append([year or "Unknown", "", era, name, full, cell(r, ci["price"]),
                    start, end, cell(r, ci["type"]), cell(r, ci["status"]),
                    cell(r, ci["link"])])
    return out


def build_passthrough(rows):
    """Art / Misc / Music Videos / Album Copies: re-serialise, drop empty rows."""
    out = [r for r in rows if any(clean(c) for c in r)]
    return out


# ------------------------------------------------------------- era derivation --
def derive_eras(unrel):
    """Ordered union of every era referenced in the unreleased schema output."""
    order, seen = [], set()
    for r in unrel:
        if is_count_header(r[0]):
            era = clean(r[1])
        else:
            era = clean(r[0])
        if era and era not in seen:
            seen.add(era)
            order.append(era)
    return order


# ------------------------------------------------------------- config output --
def ts_str(s):
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ") + "'"


def gen_config(slug, name, accent, letter, label, eras, flags):
    rd = ",\n".join(f"    {ts_str(e)}: '??/??/????'" for e in eras)
    order = ",\n".join(f"    {ts_str(e)}" for e in eras)
    extra = []
    if flags.get("albumcopies"):
        extra.append("  hasAlbumCopiesTab: true,")
    if flags.get("groupbuys"):
        extra.append("  hasGroupbuysTab: true,")
    extra_s = ("\n" + "\n".join(extra)) if extra else ""
    var = slug + "Config"
    return f"""import type {{ ArtistConfig }} from './types';

// {name} tracker. Data served from committed CSV snapshots under
// public/{slug}/data/*.csv, transformed from the source Google-Sheet exports by
// scripts/build-bigupdate-csvs.py. An era only appears in the Music grid if its
// name is a key in ALBUM_RELEASE_DATES.
export const {var}: ArtistConfig = {{
  slug: '{slug}',
  SITE_NAME: '{slug.upper()}',
  SITE_DESCRIPTION: 'The Best {name} Tracker In The World!',
  SITE_URL: 'https://unvaulted.cc/{slug}/',
  OG_IMAGE_URL: '',
  STORAGE_PREFIX: '{slug}_',

  HARDCODED_SHEET_ID: '',
  HARDCODED_SHEET_GID: '',
  SHEET_URL_UNRELEASED: '',
  SHEET_URL_RECENT: '',

  accentColor: '{accent}',
  artistLabel: {ts_str(label)},
  cardLetter: '{letter}',
  logoUrl: '',
  artistPhotoUrl: '/artists/{slug}.jpg',

  getArtistName() {{
    return {ts_str(name)};
  }},

  CUSTOM_IMAGES: {{}},

  ALBUM_RELEASE_DATES: {{
{rd}
  }},

  HIDDEN_ALBUMS: [],
  ALBUM_DESCRIPTIONS: {{}},
  ALBUM_SONG_COUNTS: {{}},
  CUSTOM_ALBUM_INFO: {{}},
  ERA_MAPPINGS: {{}},

  ALBUM_ORDER: [
{order}
  ],

  TAG_MAP: {{}},
  TAG_TOOLTIP_MAP: {{}},
  ERA_THEMES: {{}},
  hasSubAlbumsTab: false, // no sub-albums data for this tracker{extra_s}
}};
"""


# --------------------------------------------------------------------- main --
def process(folder, meta):
    slug, name, accent, letter, label = meta
    src_dir = os.path.join(SRC_ROOT, folder)
    dst_dir = os.path.join(ROOT, "public", slug)
    data_dir = os.path.join(dst_dir, "data")
    print(f"\n{folder} -> {slug}")

    # map source files to canonical tabs (first file wins per tab)
    tabs = {}
    for fn in sorted(os.listdir(src_dir)):
        if not fn.lower().endswith(".csv"):
            continue
        title = fn.rsplit(" - ", 1)[-1].rsplit(".csv", 1)[0].strip()
        c = canon_tab(title)
        if c and c not in tabs:
            tabs[c] = os.path.join(src_dir, fn)

    if "unreleased" not in tabs:
        print(f"    !! no unreleased tab found; skipping {slug}")
        return None

    os.makedirs(data_dir, exist_ok=True)
    unrel = build_unreleased(read_rows(tabs["unreleased"]))
    write_csv(data_dir, "unreleased.csv", UNREL_HEADER, unrel)

    if "released" in tabs:
        rows = build_released(read_rows(tabs["released"]))
        write_csv(data_dir, "released.csv",
                  ["Era", "Name", "Notes", "Length", "Release Date", "Type", "Streaming", "Link(s)"], rows)
    if "stems" in tabs:
        rows = build_stems(read_rows(tabs["stems"]))
        write_csv(data_dir, "stems.csv",
                  ["Era", "Name", "Notes", "File Date", "Leak Date", "Full Length", "BPM", "Available Length", "Quality", "Link(s)"], rows)
    if "tracklists" in tabs:
        hdr, rows = build_tracklists(read_rows(tabs["tracklists"]), dst_dir)
        write_csv(data_dir, "tracklists.csv", hdr, rows)
    if "fakes" in tabs:
        rows = build_fakes(read_rows(tabs["fakes"]))
        write_csv(data_dir, "fakes.csv",
                  ["Era", "Name", "Notes", "Made By", "Type", "Currently Available", "Link(s)"], rows)

    flags = {}
    if "album-copies" in tabs:
        rows = build_passthrough(read_rows(tabs["album-copies"]))
        write_csv(data_dir, "album-copies.csv", rows[0], rows[1:])
        flags["albumcopies"] = True
    if "groupbuys" in tabs:
        rows = build_groupbuys(read_rows(tabs["groupbuys"]))
        write_csv(data_dir, "groupbuys.csv",
                  ["Year", "YearTotal", "Era", "Name", "Content", "Price", "Start", "End", "Type", "Status", "Link"], rows)
        flags["groupbuys"] = True
    for tab in ("art", "misc", "music-videos"):
        if tab in tabs:
            rows = build_passthrough(read_rows(tabs[tab]))
            if rows:
                write_csv(data_dir, f"{tab}.csv", rows[0], rows[1:])

    # recent: use source tab if present, else derive from unreleased
    if "recent" in tabs:
        rows = build_unreleased(read_rows(tabs["recent"]))
        write_csv(data_dir, "recent.csv", UNREL_HEADER, rows)
    else:
        write_csv(data_dir, "recent.csv", UNREL_HEADER, build_recent_from_unrel(unrel))

    eras = derive_eras(unrel)
    cfg = gen_config(slug, name, accent, letter, label, eras, flags)
    with open(os.path.join(ROOT, "src", "artists", f"{slug}.ts"), "w", encoding="utf-8") as f:
        f.write(cfg)
    print(f"    src/artists/{slug}.ts: {len(eras)} eras")
    return slug


def main():
    slugs = []
    for folder, meta in ARTISTS.items():
        s = process(folder, meta)
        if s:
            slugs.append((meta[0], meta[1]))
    print("\n\n=== registry imports ===")
    for slug, _ in slugs:
        print(f"import {{ {slug}Config }} from './{slug}';")
    print("\n=== registry entries ===")
    for slug, name in slugs:
        print(f"  {slug}: {slug}Config,   // {name}")


if __name__ == "__main__":
    main()
