// Juice WRLD Tracker - Link Extractor
// HOW TO RUN:
// 1. Go to script.google.com, New project, paste this file
// 2. Click Run -> extractLinks, approve permissions
// 3. Check Google Drive for "juice-links.csv"

var SHEET_ID = '1tD3ytt5wPx4zfcefXi5ATeYhIiDaugWjMS46nZrP568';

var TABS = [
  { name: 'unreleased', gid: 0 },
  { name: 'released',   gid: 2006526517 },
  { name: 'recent',     gid: 1558109614 },
  { name: 'fakes',      gid: 127937350 },
  { name: 'tracklists', gid: 1999300901 }
];

function extractLinks() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var csvRows = [['Tab', 'Era', 'Name', 'URL']];

  for (var t = 0; t < TABS.length; t++) {
    var tabDef = TABS[t];

    // Find sheet by gid
    var sheets = ss.getSheets();
    var sheet = null;
    for (var s = 0; s < sheets.length; s++) {
      if (sheets[s].getSheetId() === tabDef.gid) { sheet = sheets[s]; break; }
    }
    if (!sheet) { Logger.log('Sheet not found: ' + tabDef.name); continue; }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2) continue;

    // Read and normalise headers
    var rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var headers = [];
    for (var h = 0; h < rawHeaders.length; h++) {
      headers[h] = String(rawHeaders[h]).replace(/\n/g, ' ').trim().toLowerCase();
    }

    var eraIdx  = -1;
    var nameIdx = -1;
    var linkIdxs = []; // collect ALL columns that contain "link"

    for (var h = 0; h < headers.length; h++) {
      if (eraIdx  < 0 && headers[h].indexOf('era')  === 0) eraIdx  = h;
      if (nameIdx < 0 && headers[h].indexOf('name') === 0) nameIdx = h;
      if (headers[h].indexOf('link') >= 0) linkIdxs.push(h);
    }

    Logger.log(tabDef.name + ' | era:' + eraIdx + ' name:' + nameIdx + ' links:' + JSON.stringify(linkIdxs) + ' | headers: ' + headers.join(' | '));

    if (eraIdx < 0 || nameIdx < 0 || linkIdxs.length === 0) {
      Logger.log('Skipping ' + tabDef.name + ': could not find required columns');
      continue;
    }

    var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    var values    = dataRange.getValues();
    var richTexts = dataRange.getRichTextValues();

    for (var row = 0; row < values.length; row++) {
      var era  = String(values[row][eraIdx]  || '').trim();
      var name = String(values[row][nameIdx] || '').split('\n')[0].trim();
      if (!era || !name) continue;

      // Skip summary/changelog rows
      var eraLower = era.toLowerCase();
      if (era.indexOf('\n') >= 0) continue;
      if (eraLower.indexOf('era complete') >= 0) continue;
      if (eraLower.indexOf('notice') >= 0) continue;
      if (eraLower.indexOf('updated') >= 0) continue;
      if (eraLower.indexOf('guidelines') >= 0) continue;
      if (eraLower.indexOf('editor') >= 0) continue;

      // Extract URLs from every link column
      var seen = {};
      for (var li = 0; li < linkIdxs.length; li++) {
        var col = linkIdxs[li];
        var richCell = richTexts[row][col];
        var runs = richCell.getRuns();

        for (var r = 0; r < runs.length; r++) {
          var url = runs[r].getLinkUrl();
          if (url && !seen[url]) { seen[url] = true; csvRows.push([tabDef.name, era, name, url]); }
        }

        // Fallback: cell-level link
        var cellLink = richCell.getLinkUrl();
        if (cellLink && !seen[cellLink]) { seen[cellLink] = true; csvRows.push([tabDef.name, era, name, cellLink]); }

        // Fallback: raw URLs in plain text
        var cellText = String(values[row][col] || '');
        var matches = cellText.match(/https?:\/\/\S+/g);
        if (matches) {
          for (var m = 0; m < matches.length; m++) {
            var u = matches[m].replace(/[,\s]+$/, '');
            if (u && !seen[u]) { seen[u] = true; csvRows.push([tabDef.name, era, name, u]); }
          }
        }
      }
    }

    Logger.log(tabDef.name + ': done, running total ' + (csvRows.length - 1) + ' links');
  }

  // Write CSV to Drive
  var csvContent = '';
  for (var i = 0; i < csvRows.length; i++) {
    var line = [];
    for (var c = 0; c < csvRows[i].length; c++) {
      line.push('"' + String(csvRows[i][c]).replace(/"/g, '""') + '"');
    }
    csvContent += line.join(',') + '\n';
  }

  var file = DriveApp.createFile('juice-links.csv', csvContent, MimeType.CSV);
  Logger.log('Done! ' + (csvRows.length - 1) + ' links. File: ' + file.getUrl());
}
