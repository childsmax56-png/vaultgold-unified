// KENGOLD (Ken Carson) Tracker - Link Extractor
//
// The public gviz/CSV export of this sheet only contains the DISPLAY TEXT of each
// hyperlink (e.g. "Pixeldrain", "Download") — never the real href. This Apps
// Script reads the sheet's rich-text link URLs directly and writes them to a CSV
// in your Google Drive, which build-kengold-csvs.mjs then merges into the
// committed public/kengold/data/*.csv files.
//
// HOW TO RUN:
// 1. Go to script.google.com -> New project, paste this file.
// 2. Click Run -> extractLinks, approve permissions.
// 3. Find "kengold-links.csv" in your Google Drive, download it to ~/Downloads.
// 4. Run: node scripts/build-kengold-csvs.mjs
//
// You do NOT need edit access to the sheet — anonymous "anyone with the link"
// view access is enough for SpreadsheetApp.openById to read it.

var SHEET_ID = '1OARID98xCqRaBr8gyQCvI3aD4jKQDGgtedyRaiP_pyo';

// linkMode:
//   'prefer' -> for the two-column tabs, take the PIXELDRAIN link if present,
//               otherwise fall back to the LASTSHARE link (single URL per song).
//   'all'    -> take every hyperlink found (pixeldrain-first ordering).
var TABS = [
  { name: 'unreleased', gid: 1367980602, linkMode: 'prefer' },
  { name: 'recent',     gid: 907300840,  linkMode: 'prefer' },
  { name: 'released',   gid: 694454699,  linkMode: 'all'    },
  { name: 'stems',      gid: 1126926347, linkMode: 'all'    },
  { name: 'art',        gid: 1908257498, linkMode: 'all'    },
  { name: 'misc',       gid: 1210294036, linkMode: 'all'    },
  { name: 'tracklists', gid: 372423620,  linkMode: 'all'    }
];

function extractLinks() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var csvRows = [['Tab', 'Era', 'Name', 'URL']];

  for (var t = 0; t < TABS.length; t++) {
    var tabDef = TABS[t];

    var sheets = ss.getSheets();
    var sheet = null;
    for (var s = 0; s < sheets.length; s++) {
      if (sheets[s].getSheetId() === tabDef.gid) { sheet = sheets[s]; break; }
    }
    if (!sheet) { Logger.log('Sheet not found: ' + tabDef.name); continue; }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2) continue;

    var rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var headers = [];
    for (var h = 0; h < rawHeaders.length; h++) {
      headers[h] = String(rawHeaders[h]).replace(/\n/g, ' ').trim().toLowerCase();
    }

    var eraIdx = -1, nameIdx = -1;
    var pixelIdx = -1, lastshareIdx = -1;
    var linkIdxs = [];

    for (var h = 0; h < headers.length; h++) {
      if (eraIdx  < 0 && headers[h].indexOf('era')  === 0) eraIdx = h;
      if (nameIdx < 0 && headers[h].indexOf('name') === 0) nameIdx = h;
      if (headers[h].indexOf('pixeldrain') >= 0 || headers[h].indexOf('alternate') >= 0) pixelIdx = h;
      if (headers[h].indexOf('lastshare') >= 0 || (headers[h].indexOf('main link') >= 0)) lastshareIdx = h;
      if (headers[h].indexOf('link') >= 0 || headers[h].indexOf('stream') >= 0) linkIdxs.push(h);
    }

    Logger.log(tabDef.name + ' | era:' + eraIdx + ' name:' + nameIdx +
      ' pixel:' + pixelIdx + ' lastshare:' + lastshareIdx + ' links:' + JSON.stringify(linkIdxs));

    if (eraIdx < 0 || nameIdx < 0) {
      Logger.log('Skipping ' + tabDef.name + ': no era/name column');
      continue;
    }

    var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    var values    = dataRange.getValues();
    var richTexts = dataRange.getRichTextValues();

    // Pull every hyperlink URL out of one cell (rich-text runs + cell-level + raw text).
    function urlsInCell(row, col) {
      var found = [];
      var rich = richTexts[row][col];
      if (rich) {
        var runs = rich.getRuns();
        for (var r = 0; r < runs.length; r++) {
          var u = runs[r].getLinkUrl();
          if (u) found.push(u);
        }
        var cellLink = rich.getLinkUrl();
        if (cellLink) found.push(cellLink);
      }
      var text = String(values[row][col] || '');
      var m = text.match(/https?:\/\/\S+/g);
      if (m) for (var i = 0; i < m.length; i++) found.push(m[i].replace(/[,\s]+$/, ''));
      return found;
    }

    for (var row = 0; row < values.length; row++) {
      var era  = String(values[row][eraIdx]  || '').trim();
      var name = String(values[row][nameIdx] || '').split('\n')[0].trim();
      if (!era || !name || era.indexOf('\n') >= 0) continue; // skip count/summary rows

      var urls = [];
      if (tabDef.linkMode === 'prefer') {
        var pref = pixelIdx >= 0 ? urlsInCell(row, pixelIdx) : [];
        if (pref.length === 0 && lastshareIdx >= 0) pref = urlsInCell(row, lastshareIdx);
        urls = pref.slice(0, 1); // single preferred link
      } else {
        // pixeldrain-first ordering, then everything else
        var ordered = [];
        if (pixelIdx >= 0) ordered = ordered.concat(urlsInCell(row, pixelIdx));
        for (var li = 0; li < linkIdxs.length; li++) {
          if (linkIdxs[li] === pixelIdx) continue;
          ordered = ordered.concat(urlsInCell(row, linkIdxs[li]));
        }
        urls = ordered;
      }

      var seen = {};
      for (var k = 0; k < urls.length; k++) {
        var u = urls[k];
        if (u && !seen[u]) { seen[u] = true; csvRows.push([tabDef.name, era, name, u]); }
      }
    }

    Logger.log(tabDef.name + ': done, running total ' + (csvRows.length - 1) + ' links');
  }

  var csvContent = '';
  for (var i = 0; i < csvRows.length; i++) {
    var line = [];
    for (var c = 0; c < csvRows[i].length; c++) {
      line.push('"' + String(csvRows[i][c]).replace(/"/g, '""') + '"');
    }
    csvContent += line.join(',') + '\n';
  }

  var file = DriveApp.createFile('kengold-links.csv', csvContent, MimeType.CSV);
  Logger.log('Done! ' + (csvRows.length - 1) + ' links. File: ' + file.getUrl());
}
