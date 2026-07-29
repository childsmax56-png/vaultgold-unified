#!/usr/bin/env python3
"""Fetch + transform the Ken Carson tracker (kengold) metadata into committed CSVs.

The source Google Sheet has viewer-downloads disabled, so /export 401s. The public
gviz endpoint still returns each tab's text, so we pull from there. gviz drops
hyperlink URLs (cells carry only display text like "Pixeldrain"), so this script
writes the metadata with EMPTY Link(s) columns; the real download links are
recovered separately via extract-kengold-links.gs + build-kengold-csvs.mjs.

Usage: python3 scripts/build-kengold-metadata.py
Then:  (run extract-kengold-links.gs, download kengold-links.csv) && node scripts/build-kengold-csvs.mjs
"""
import csv, io, os, re, json, urllib.request

SHEET = "1OARID98xCqRaBr8gyQCvI3aD4jKQDGgtedyRaiP_pyo"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "kengold")

GIDS = {
    "unreleased": "1367980602", "recent": "907300840", "released": "694454699",
    "stems": "1126926347", "art": "1908257498", "misc": "1210294036",
    "tracklists": "372423620", "groupbuys": "296594220",
}

LABELS = sorted([
    "Era", "Name", "Notes", "Track Length", "File Date", "File\nDate", "Leak Date",
    "Leak\nDate", "Type", "Portion", "Quality", "Main Link", "Alternate Links",
    "Streaming Link(s)", "Download Link", "Streaming", "Date", "Image", "Used?",
    "Link(s)", "Link", "Source", "Tracklist", "Information", "Price", "End Date",
    "State", "#",
], key=len, reverse=True)


def gviz_csv(gid):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET}/gviz/tq?tqx=out:csv&gid={gid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as r:
        return list(csv.reader(io.StringIO(r.read().decode("utf-8"))))


def strip_label(cell):
    for lab in LABELS:
        if cell[:len(lab)].lower() == lab.lower():
            rest = cell[len(lab):]
            if rest == "" or rest[0] in " \n\t":
                return rest.strip()
    return cell.strip()


def transform(tab, canon, src):
    rows = gviz_csv(GIDS[tab])
    out = [canon]
    for i, row in enumerate(rows):
        cells = [strip_label(c) for c in row] if i == 0 else row
        rec = [(cells[s].strip() if (s is not None and s < len(cells)) else "") for s in src]
        if not rec[0] and not rec[1]:
            continue
        out.append(rec)
    path = os.path.join(OUT, "data", tab + ".csv")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(out)
    print(f"{tab:11} {len(out)-1:4} rows")


transform("unreleased", ['Era','Name','Notes','Track Length','File Date','Leak Date','Available Length','Quality','Link(s)'], [0,1,2,3,4,5,7,8,None])
transform("recent",     ['Era','Name','Notes','Track Length','File Date','Leak Date','Available Length','Quality','Link(s)'], [0,1,2,3,4,5,7,8,None])
transform("released",   ['Era','Name','Notes','Length','Release Date','Type','Streaming','Link(s)'], [0,2,3,4,5,6,7,None])
transform("stems",      ['Era','Name','Notes','File Date','Leak Date','Full Length','BPM','Available Length','Quality','Link(s)'], [0,1,2,4,None,3,None,5,6,None])
transform("art",        ['Era','Name','Notes','Designer','Art Type','Image','Project Type','Use','Link(s)'], [0,1,2,None,4,None,None,5,None])
transform("misc",       ['Era','Name','Notes','Image / Length','Date Made','Type','Available Length','Quality','Link(s)'], [0,1,2,None,3,4,5,6,None])
transform("tracklists", ['Era','Name','Tracklist','Image','Date Made','Quality','Source','Link(s)'], [0,1,2,None,4,5,6,None])


def build_groupbuys():
    rows = gviz_csv(GIDS["groupbuys"])
    YEAR = re.compile(r"\b(20[0-3]\d)\b")
    out = [["Year","YearTotal","Era","Name","Content","Price","Start","End","Type","Status","Link"]]
    for row in rows[1:]:
        c = [x.strip() for x in row] + [""] * 11
        era, name, info, price, end, typ, state = c[0], c[1], c[2], c[3], c[4], c[5], c[6]
        if not name:
            continue
        m = YEAR.search(end) or YEAR.search(info)
        out.append([m.group(1) if m else "Unknown", "", era, name, info, price, "", end, typ, state, ""])
    with open(os.path.join(OUT, "data", "groupbuys.csv"), "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(out)
    print(f"{'groupbuys':11} {len(out)-1:4} rows")


build_groupbuys()


def build_tracklists_json():
    rows = gviz_csv(GIDS["tracklists"])
    TRACK = re.compile(r"^\s*#?\s*(\d+)[.)]\s*(.+?)\s*$")
    albums = []
    for i, row in enumerate(rows):
        cells = [strip_label(c) for c in row] if i == 0 else row
        c = [x.strip() for x in cells] + [""] * 8
        era, name, tl, date, portion, source = c[0], c[1], c[2], c[4], c[5], c[6]
        if not era or not name:
            continue
        tracks = [{"num": "#" + m.group(1), "name": m.group(2).strip()}
                  for line in tl.split("\n") if (m := TRACK.match(line))]
        if not tracks:
            continue
        albums.append({"era": era, "name": name.split("\n")[0].strip(), "date": date,
                       "quality": portion, "source": source, "links": [], "tracks": tracks})
    with open(os.path.join(OUT, "Tracklists.json"), "w", encoding="utf-8") as f:
        json.dump(albums, f, ensure_ascii=False, indent=1)
    print(f"{'Tracklists':11} {len(albums):4} albums")


build_tracklists_json()
