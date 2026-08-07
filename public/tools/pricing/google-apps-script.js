/*
  ============================================================================
  Mr. Printer Studio — Google Sheet Sync Bridge (Pricing + Inventory)
  ============================================================================
  Paste this into: Google Sheet → Extensions → Apps Script
  Then Deploy → New deployment → Web app
    Execute as: Me
    Who has access: Anyone

  Sheet used:
  https://docs.google.com/spreadsheets/d/1HaJIjWntMd16vnSAFa9wASb_sWds2YwmrN4yGmGZ84M/edit

  API:
    GET  ?api=1              → { ok, products: [...] }
    POST text/plain JSON     → upsert | delete | replaceAll
  ============================================================================
*/

var SHEET_NAME = "Pricing"; // create/rename tab to this, or first sheet is used as fallback

var HEADERS = [
  "id",
  "sku",
  "name",
  "dims",
  "weight",
  "colors",
  "printHours",
  "postMin",
  "designHours",
  "designRate",
  "packaging",
  "shipping",
  "packagingExtras",
  "packagingCustom",
  "inventoryRitesh",
  "inventoryMayuri",
  "inventoryTotal",
  "marginPct",
  "materialCost",
  "finalTotalCost",
  "sellingPrice",
  "mrp",
  "mrpSource",
  "meesho",
  "meeshoSource",
  "updatedAt",
];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    // If the first sheet is empty / untitled, rename it for clarity
    if (sheet.getLastRow() === 0) sheet.setName(SHEET_NAME);
  }
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), HEADERS.length);
  var existing = [];
  if (sheet.getLastRow() >= 1 && sheet.getLastColumn() >= 1) {
    existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  var needsWrite = existing.length < HEADERS.length;
  if (!needsWrite) {
    for (var i = 0; i < HEADERS.length; i++) {
      if (String(existing[i] || "") !== HEADERS[i]) {
        needsWrite = true;
        break;
      }
    }
  }
  if (needsWrite) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function rowToProduct_(headers, row) {
  var p = {};
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || "").trim();
    if (!key) continue;
    p[key] = row[i];
  }
  // Friendly aliases → canonical inventory keys
  if (p.inventoryRitesh == null || p.inventoryRitesh === "") {
    p.inventoryRitesh = firstNum_(p, ["Stock Ritesh", "stockRitesh", "ritesh", "Ritesh"]);
  }
  if (p.inventoryMayuri == null || p.inventoryMayuri === "") {
    p.inventoryMayuri = firstNum_(p, ["Stock Mayuri", "stockMayuri", "mayuri", "Mayuri"]);
  }
  var r = Number(p.inventoryRitesh) || 0;
  var m = Number(p.inventoryMayuri) || 0;
  p.inventoryRitesh = r;
  p.inventoryMayuri = m;
  p.inventoryTotal = r + m;
  return p;
}

function firstNum_(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    if (obj[keys[i]] != null && obj[keys[i]] !== "") return obj[keys[i]];
  }
  return 0;
}

function productToRow_(p) {
  var r = Number(p.inventoryRitesh) || 0;
  var m = Number(p.inventoryMayuri) || 0;
  var map = {
    id: p.id || "",
    sku: p.sku || "",
    name: p.name || "",
    dims: p.dims || "",
    weight: p.weight || 0,
    colors: p.colors || "[]",
    printHours: p.printHours || 0,
    postMin: p.postMin || 0,
    designHours: p.designHours || 0,
    designRate: p.designRate || 0,
    packaging: p.packaging || 0,
    shipping: p.shipping || 0,
    packagingExtras: p.packagingExtras || "{}",
    packagingCustom: p.packagingCustom || "[]",
    inventoryRitesh: r,
    inventoryMayuri: m,
    inventoryTotal: r + m,
    marginPct: p.marginPct || 0,
    materialCost: p.materialCost || 0,
    finalTotalCost: p.finalTotalCost || 0,
    sellingPrice: p.sellingPrice || 0,
    mrp: p.mrp || 0,
    mrpSource: p.mrpSource || "auto",
    meesho: p.meesho || 0,
    meeshoSource: p.meeshoSource || "auto",
    updatedAt: new Date().toISOString(),
  };
  return HEADERS.map(function (h) {
    return map[h] != null ? map[h] : "";
  });
}

function findRowById_(sheet, id) {
  if (!id) return -1;
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var ids = sheet.getRange(2, 1, last, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function readAllProducts_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), HEADERS.length);
  if (lastRow < 2) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow, lastCol).getValues();
  var products = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    // skip fully empty rows
    var empty = true;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== "" && row[c] != null) {
        empty = false;
        break;
      }
    }
    if (empty) continue;
    var p = rowToProduct_(headers, row);
    if (!p.id) p.id = "sheet-" + (i + 2) + "-" + Date.now();
    products.push(p);
  }
  return products;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function hubHtml_() {
  return (
    "<!doctype html><html><head><meta charset='utf-8'><title>Mr. Printer Tools Hub</title>" +
    "<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#241610;background:#faf3e7}" +
    "a{display:block;padding:14px 16px;margin:10px 0;background:#fff;border:1px solid #e5d6b8;border-radius:12px;text-decoration:none;color:#241610;font-weight:700}" +
    "h1{font-size:22px}</style></head><body>" +
    "<h1>Mr. Printer Tools Hub</h1>" +
    "<p>Shared tools for the studio.</p>" +
    "<a href='https://mr-printer.vercel.app/tools/pricing'>Pricing Calculator</a>" +
    "<a href='https://mr-printer.vercel.app/'>Studio Home</a>" +
    "<p style='color:#8c7b64;font-size:13px'>API: append <code>?api=1</code> to this Web App URL.</p>" +
    "</body></html>"
  );
}

function doGet(e) {
  try {
    var api = e && e.parameter && e.parameter.api;
    if (String(api) === "1") {
      var sheet = getSheet_();
      return jsonOut_({ ok: true, products: readAllProducts_(sheet) });
    }
    return HtmlService.createHtmlOutput(hubHtml_());
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(body);
    var action = data.action;
    var sheet = getSheet_();

    if (action === "upsert") {
      var p = data.product || {};
      if (!p.id) throw new Error("Product id is required.");
      var row = productToRow_(p);
      var existing = findRowById_(sheet, p.id);
      if (existing === -1) {
        sheet.appendRow(row);
      } else {
        sheet.getRange(existing, 1, existing, HEADERS.length).setValues([row]);
      }
      return jsonOut_({ ok: true, action: "upsert", id: p.id });
    }

    if (action === "delete") {
      var delId = data.id;
      var delRow = findRowById_(sheet, delId);
      if (delRow !== -1) sheet.deleteRow(delRow);
      return jsonOut_({ ok: true, action: "delete", id: delId });
    }

    if (action === "replaceAll") {
      var products = data.products || [];
      var last = sheet.getLastRow();
      if (last > 1) {
        sheet
          .getRange(2, 1, last, Math.max(sheet.getLastColumn(), HEADERS.length))
          .clearContent();
      }
      if (products.length) {
        var rows = products.map(productToRow_);
        sheet.getRange(2, 1, products.length + 1, HEADERS.length).setValues(rows);
      }
      return jsonOut_({ ok: true, action: "replaceAll", count: products.length });
    }

    throw new Error("Unknown action: " + action);
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}
