// Sheet Link Extractor (Google Apps Script) - saves a links CSV to your Drive.
//
// The public CSV/gviz export of a sheet only keeps the DISPLAY TEXT of each
// hyperlink (e.g. "Pixeldrain", "Download") - never the real href. This reads
// the sheet's rich-text link URLs directly and writes them to a CSV in your
// Google Drive. (scripts/extract-sheet-links.py is the local-Python equivalent;
// it writes the same CSV to your computer instead of Drive.)
//
// HOW TO RUN:
// 1. Go to script.google.com -> New project, paste this whole file.
// 2. Click Run -> extractLinks, approve permissions when asked.
// 3. Find "sheet-links.csv" in your Google Drive (root), download it.
//
// You do NOT need edit access - anonymous "anyone with the link" view is enough.
// This walks EVERY tab automatically, so there are no gids to configure.

var SHEET_ID = '1a8_li_D3rG0iDLqT9AGZsRVojlEyhO_nb735cRpyUvE';
var OUT_FILE = 'sheet-links.csv';

function extractLinks() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheets = ss.getSheets();
  var csvRows = [['Tab', 'Era', 'Name', 'URL']];

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var tabName = sheet.getName();
    // Skip non-grid tabs (chart/object sheets); grid methods throw on them.
    if (sheet.getType() !== SpreadsheetApp.SheetType.GRID) {
      Logger.log('Skipping non-grid sheet: ' + tabName);
      continue;
    }
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) continue;

    // Find the header row (scan first 15 rows) and the Era / Name columns.
    var headerRow = -1, eraIdx = -1, nameIdx = -1;
    var scan = Math.min(15, lastRow);
    var top = sheet.getRange(1, 1, scan, lastCol).getValues();
    for (var r = 0; r < scan; r++) {
      var e = -1, n = -1;
      for (var c = 0; c < lastCol; c++) {
        var h = String(top[r][c]).replace(/\n/g, ' ').trim().toLowerCase();
        if (e < 0 && h.indexOf('era') === 0) e = c;
        if (n < 0 && (h.indexOf('name') === 0 || h.indexOf('title') === 0)) n = c;
      }
      if (e >= 0 && n >= 0) { headerRow = r + 1; eraIdx = e; nameIdx = n; break; }
    }
    if (headerRow < 0) headerRow = 1; // fall back: no era/name, still grab links

    var dataStart = headerRow + 1;
    if (dataStart > lastRow) continue;
    var dataRange = sheet.getRange(dataStart, 1, lastRow - dataStart + 1, lastCol);
    var values    = dataRange.getValues();
    var richTexts = dataRange.getRichTextValues();

    // Every URL reachable from one cell: rich-text runs, cell-level link, raw text.
    function urlsInCell(row, col) {
      var found = [];
      var rich = richTexts[row][col];
      if (rich) {
        var runs = rich.getRuns();
        for (var i = 0; i < runs.length; i++) {
          var u = runs[i].getLinkUrl();
          if (u) found.push(u);
        }
        var cellLink = rich.getLinkUrl();
        if (cellLink) found.push(cellLink);
      }
      var text = String(values[row][col] || '');
      var m = text.match(/https?:\/\/\S+/g);
      if (m) for (var j = 0; j < m.length; j++) found.push(m[j].replace(/[,\s]+$/, ''));
      return found;
    }

    var tabTotal = 0;
    for (var row = 0; row < values.length; row++) {
      var era  = eraIdx  >= 0 ? String(values[row][eraIdx]  || '').trim() : '';
      var name = nameIdx >= 0 ? String(values[row][nameIdx] || '').split('\n')[0].trim() : '';
      // Skip count / section-summary rows (multi-line era cell).
      if (eraIdx >= 0 && String(values[row][eraIdx] || '').indexOf('\n') >= 0) continue;

      var seen = {};
      for (var col = 0; col < lastCol; col++) {
        if (col === eraIdx || col === nameIdx) continue;
        var urls = urlsInCell(row, col);
        for (var k = 0; k < urls.length; k++) {
          var u = urls[k];
          if (u && !seen[u]) { seen[u] = true; csvRows.push([tabName, era, name, u]); tabTotal++; }
        }
      }
    }
    Logger.log(tabName + ': ' + tabTotal + ' links');
  }

  // Serialise + write to Drive.
  var csv = '';
  for (var i = 0; i < csvRows.length; i++) {
    var line = [];
    for (var c = 0; c < csvRows[i].length; c++) {
      line.push('"' + String(csvRows[i][c]).replace(/"/g, '""') + '"');
    }
    csv += line.join(',') + '\n';
  }
  var file = DriveApp.createFile(OUT_FILE, csv, MimeType.CSV);
  Logger.log('Done! ' + (csvRows.length - 1) + ' links. File: ' + file.getUrl());
}
