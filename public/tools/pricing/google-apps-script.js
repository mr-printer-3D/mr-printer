/*
  ============================================================================
  Mr. Printer Studio — Google Sheet Sync Bridge (Pricing + Inventory + Images)
  ============================================================================
  Paste into: Google Sheet → Extensions → Apps Script
  Also set Project Settings → Show "appsscript.json" manifest to match
  public/tools/pricing/appsscript.json (must include Drive scope).

  Deploy → New deployment → Web app
    Execute as: Me
    Who has access: Anyone

  DRIVE PERMISSION (required for image upload):
  1. Paste this file + set appsscript.json Drive scope
  2. Run authorizeDrive (fast). If timeout on first Allow, Run again.
  3. Optional: run checkDriveFolder
  4. Deploy → Manage deployments → Edit → New version → Deploy

  Sheet:
  https://docs.google.com/spreadsheets/d/1HaJIjWntMd16vnSAFa9wASb_sWds2YwmrN4yGmGZ84M/edit

  API:
    GET  ?api=1
    POST text/plain JSON → upsert | upsertMany | delete | replaceAll |
         repairHeaders | uploadProductImages | deleteDriveFiles | deleteDriveSkuFolder
  ============================================================================
*/

var SHEET_NAME = "Pricing";
/** Bump when fixing sync bugs — Test Connection shows this so you know the Web App is updated */
var SCRIPT_VERSION = 13;

/** Same Drive parent used by listing images / Meesho */
var DEFAULT_DRIVE_PARENT_ID = "1wjql3Yu4fNZJNolL780WKepimVuTKPoh";

/**
 * FAST auth — run this first. Do NOT create folders / show alerts here
 * (those often hit "Exceeded maximum execution time" during OAuth).
 *
 * Steps:
 *   1) Project Settings → Show appsscript.json → include auth/drive scope → Save
 *   2) Select authorizeDrive → Run ▶
 *   3) If a Review permissions popup appears: Allow within ~30s (Drive + Sheets)
 *   4) If first run says "Exceeded maximum execution time": that is normal —
 *      permissions may already be granted. Run authorizeDrive AGAIN.
 *   5) Execution log should show: Drive OK
 *   6) Optional: run checkDriveFolder (tests parent folder access)
 *   7) Deploy → Manage deployments → Edit → New version → Deploy
 */
function authorizeDrive() {
  // One cheap Drive call — enough to request / confirm Drive OAuth.
  var id = DriveApp.getRootFolder().getId();
  Logger.log("Drive OK. rootId=" + id + " script v" + SCRIPT_VERSION);
  return "Drive OK (v" + SCRIPT_VERSION + "). If this was first Allow, run once more, then Deploy → New version.";
}

/**
 * Optional second check: can this account open the image parent folder?
 * Run only AFTER authorizeDrive succeeds quickly.
 */
function checkDriveFolder() {
  var parent = DriveApp.getFolderById(DEFAULT_DRIVE_PARENT_ID);
  var name = parent.getName();
  Logger.log("Parent folder OK: " + name + " (" + DEFAULT_DRIVE_PARENT_ID + ")");
  return "Parent folder OK: " + name;
}

function pingDrive_() {
  try {
    // Keep ping cheap — name only, no create/trash (avoids timeouts).
    var parent = DriveApp.getFolderById(DEFAULT_DRIVE_PARENT_ID);
    return {
      ok: true,
      drive: true,
      parentName: parent.getName(),
      parentId: DEFAULT_DRIVE_PARENT_ID,
    };
  } catch (err) {
    return { ok: false, drive: false, error: String(err) };
  }
}

/** Official columns only — do not add extra headers in the sheet */
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
  "image1",
  "image2",
  "image3",
  "image4",
  "image5",
  "collections",
  "updatedAt",
];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.setName(SHEET_NAME);
  }
  ensureHeaders_(sheet);
  return sheet;
}

/** Keep row 1 exactly = HEADERS. Clear any extra header cells to the right. */
function ensureHeaders_(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  var lastCol = sheet.getLastColumn();
  if (lastCol > HEADERS.length) {
    // getRange(row, column, numRows, numColumns)
    sheet.getRange(1, HEADERS.length + 1, 1, lastCol - HEADERS.length).clearContent();
  }
}

function rowToProduct_(row) {
  var p = {};
  for (var i = 0; i < HEADERS.length; i++) {
    p[HEADERS[i]] = row[i] != null ? row[i] : "";
  }

  // Repair legacy misaligned seed rows (old dump: colors=waste, printHours=filament, postMin=hours…)
  p = repairLegacyProduct_(p);

  var r = Number(p.inventoryRitesh) || 0;
  var m = Number(p.inventoryMayuri) || 0;
  p.inventoryRitesh = r;
  p.inventoryMayuri = m;
  p.inventoryTotal = r + m;
  return p;
}

/**
 * Old sheet rows put values under the wrong headers.
 * Detect: colors is a number (e.g. 10) and printHours looks like filament ₹/kg (e.g. 800).
 */
function repairLegacyProduct_(p) {
  var colorsVal = p.colors;
  var colorsIsNumber =
    typeof colorsVal === "number" ||
    (typeof colorsVal === "string" &&
      colorsVal !== "" &&
      !String(colorsVal).trim().match(/^\[/) &&
      !isNaN(Number(colorsVal)));
  var hoursLikeFilament = Number(p.printHours) >= 100;

  if (!(colorsIsNumber && hoursLikeFilament)) return p;

  // Remap from old column order dumped into new headers
  var weight = Number(p.weight) || 0;
  var printHours = Number(p.postMin) || 0; // was actual hours
  var postMin = Number(p.packagingCustom) || 15;
  var packaging = Number(p.packaging) || 10;
  var marginPct = Number(p.marginPct) || 50;
  var designRate = Number(p.inventoryRitesh) || 50;
  var designHours = Number(p.inventoryMayuri) || 0;
  var shipping = Number(p.inventoryTotal) || 0;

  // Prefer real MRP/Meesho if present further right in older dumps (materialCost sometimes held junk)
  var mrp = Number(p.mrp);
  var meesho = Number(p.meesho);
  var mrpSource = String(p.mrpSource || "");
  var meeshoSource = String(p.meeshoSource || "");

  // In many corrupt rows, true MRP/Meesho sit in leftover human columns; keep manual if already set
  if (!mrp && Number(p.sellingPrice) > 100 && Number(p.sellingPrice) % 1 === 0) {
    // no-op — keep empty
  }

  return {
    id: p.id,
    sku: p.sku || "",
    name: p.name || "",
    dims: p.dims || "",
    weight: weight,
    colors: "[]",
    printHours: printHours,
    postMin: postMin,
    designHours: designHours,
    designRate: designRate,
    packaging: packaging,
    shipping: shipping,
    packagingExtras: '{"externalBox":false,"sticker":false,"ribbon":false}',
    packagingCustom: "[]",
    inventoryRitesh: 0,
    inventoryMayuri: 0,
    inventoryTotal: 0,
    marginPct: marginPct,
    materialCost: 0,
    finalTotalCost: 0,
    sellingPrice: 0,
    mrp: mrp || 0,
    mrpSource: mrpSource || (mrp ? "manual" : "auto"),
    meesho: meesho || 0,
    meeshoSource: meeshoSource || (meesho ? "manual" : "auto"),
    updatedAt: p.updatedAt || "",
  };
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
    image1: p.image1 || "",
    image2: p.image2 || "",
    image3: p.image3 || "",
    image4: p.image4 || "",
    image5: p.image5 || "",
    collections: p.collections || "[]",
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
  // numRows = data rows only (exclude header)
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function readAllProducts_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var numDataRows = lastRow - 1;
  // Use offset() so row count is unambiguous (same pattern as replaceAll write)
  var values = sheet.getRange(2, 1).offset(0, 0, numDataRows, HEADERS.length).getValues();
  var products = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var empty = true;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== "" && row[c] != null) {
        empty = false;
        break;
      }
    }
    if (empty) continue;
    var p = rowToProduct_(row);
    // Sheets sometimes returns numeric-looking ids; always stringify
    p.id = p.id != null && String(p.id).trim() !== "" ? String(p.id).trim() : "";
    if (!p.id) p.id = "sheet-" + (i + 2) + "-" + Date.now();
    products.push(p);
  }
  return products;
}

function clearExtraColumns_(sheet) {
  var lastCol = sheet.getLastColumn();
  var lastRow = Math.max(sheet.getLastRow(), 1);
  if (lastCol > HEADERS.length) {
    sheet
      .getRange(1, HEADERS.length + 1, lastRow, lastCol - HEADERS.length)
      .clearContent();
  }
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
      return jsonOut_({
        ok: true,
        scriptVersion: SCRIPT_VERSION,
        products: readAllProducts_(sheet),
      });
    }
    return HtmlService.createHtmlOutput(hubHtml_());
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err), scriptVersion: SCRIPT_VERSION });
  }
}

function doPost(e) {
  try {
    var body = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(body);
    var action = data.action;

    if (action === "pingDrive") {
      var driveInfo = pingDrive_();
      return jsonOut_({
        ok: !!driveInfo.ok,
        action: "pingDrive",
        scriptVersion: SCRIPT_VERSION,
        drive: driveInfo.drive,
        parentName: driveInfo.parentName || "",
        parentId: driveInfo.parentId || "",
        error: driveInfo.error || "",
      });
    }

    var sheet = getSheet_();

    if (action === "repairHeaders") {
      ensureHeaders_(sheet);
      clearExtraColumns_(sheet);
      return jsonOut_({
        ok: true,
        action: "repairHeaders",
        scriptVersion: SCRIPT_VERSION,
        headers: HEADERS,
        message: "Headers reset. Extra columns cleared. Re-push catalog from the pricing tool.",
      });
    }

    if (action === "upsert") {
      var p = data.product || {};
      if (!p.id) throw new Error("Product id is required.");
      var row = productToRow_(p);
      var existing = findRowById_(sheet, p.id);
      if (existing === -1) {
        sheet.appendRow(row);
      } else {
        sheet.getRange(existing, 1).offset(0, 0, 1, HEADERS.length).setValues([row]);
      }
      return jsonOut_({ ok: true, action: "upsert", id: p.id, scriptVersion: SCRIPT_VERSION });
    }

    /**
     * Safe multi-user write: add/update rows by id.
     * Never deletes partners' products that are not in this payload.
     */
    if (action === "upsertMany") {
      var list = data.products || [];
      var added = 0;
      var updated = 0;
      var lastRow = sheet.getLastRow();
      var idToRow = {};
      if (lastRow >= 2) {
        var idCol = sheet.getRange(2, 1, lastRow, 1).getValues();
        for (var i = 0; i < idCol.length; i++) {
          var rid = String(idCol[i][0] || "").trim();
          if (rid) idToRow[rid] = i + 2;
        }
      }
      for (var j = 0; j < list.length; j++) {
        var prod = list[j] || {};
        if (!prod.id) continue;
        var prow = productToRow_(prod);
        var pid = String(prod.id).trim();
        if (idToRow[pid]) {
          sheet.getRange(idToRow[pid], 1).offset(0, 0, 1, HEADERS.length).setValues([prow]);
          updated++;
        } else {
          sheet.appendRow(prow);
          idToRow[pid] = sheet.getLastRow();
          added++;
        }
      }
      return jsonOut_({
        ok: true,
        action: "upsertMany",
        added: added,
        updated: updated,
        count: added + updated,
        scriptVersion: SCRIPT_VERSION,
      });
    }

    if (action === "delete") {
      var delId = data.id;
      var delRow = findRowById_(sheet, delId);
      if (delRow !== -1) sheet.deleteRow(delRow);
      return jsonOut_({ ok: true, action: "delete", id: delId, scriptVersion: SCRIPT_VERSION });
    }

    if (action === "replaceAll") {
      ensureHeaders_(sheet);
      clearExtraColumns_(sheet);
      var products = data.products || [];

      // Delete existing data rows (deleteRows is unambiguous — not getRange sizing)
      var last = sheet.getLastRow();
      if (last > 1) {
        sheet.deleteRows(2, last - 1);
      }

      if (products.length) {
        var rows = products.map(productToRow_);
        // offset(rowOffset, colOffset, numRows, numColumns) — matches setValues exactly
        sheet.getRange(2, 1).offset(0, 0, rows.length, HEADERS.length).setValues(rows);
      }
      return jsonOut_({
        ok: true,
        action: "replaceAll",
        count: products.length,
        scriptVersion: SCRIPT_VERSION,
      });
    }

    /**
     * Upload listing images into Drive:
     * parentFolder / {SKU} / shot-1.jpg …
     * Requires Web App deploy as "Me" with Drive access (default).
     */
    if (action === "uploadProductImages") {
      var parentFolderId = String(data.parentFolderId || "").trim();
      var sku = String(data.sku || "")
        .trim()
        .replace(/[\\/:*?"<>|]/g, "-");
      var files = data.files || [];
      if (!parentFolderId) throw new Error("parentFolderId is required.");
      if (!sku) throw new Error("sku is required (folder name).");
      if (!files.length) throw new Error("No image files to upload.");

      var parent = DriveApp.getFolderById(parentFolderId);
      var existing = parent.getFoldersByName(sku);
      var folder = existing.hasNext() ? existing.next() : parent.createFolder(sku);

      // Optional: clear previous listing jpgs with same names
      var uploaded = [];
      for (var fi = 0; fi < files.length; fi++) {
        var f = files[fi];
        var fname = String(f.name || "image-" + (fi + 1) + ".jpg").replace(
          /[\\/:*?"<>|]/g,
          "-"
        );
        var mime = f.mimeType || "image/jpeg";
        var b64 = String(f.base64 || "").replace(/^data:[^;]+;base64,/, "");
        if (!b64) continue;

        // Remove older file with same name in this SKU folder
        var olds = folder.getFilesByName(fname);
        while (olds.hasNext()) olds.next().setTrashed(true);

        var blob = Utilities.newBlob(
          Utilities.base64Decode(b64),
          mime,
          fname
        );
        var created = folder.createFile(blob);
        // Anyone-with-link viewer so Meesho image proxy / sync can read
        try {
          created.setSharing(
            DriveApp.Access.ANYONE_WITH_LINK,
            DriveApp.Permission.VIEW
          );
        } catch (shareErr) {
          // ignore if domain policy blocks
        }
        uploaded.push({
          id: created.getId(),
          name: created.getName(),
          // Thumbnail embeds reliably in browsers; uc?export=view often 403s in <img>
          url:
            "https://drive.google.com/thumbnail?id=" +
            created.getId() +
            "&sz=w2000",
        });
      }

      return jsonOut_({
        ok: true,
        action: "uploadProductImages",
        sku: sku,
        folderId: folder.getId(),
        folderName: sku,
        count: uploaded.length,
        files: uploaded,
        scriptVersion: SCRIPT_VERSION,
      });
    }

    /**
     * Trash Drive files by id (from image URLs deleted in the Pricing tool).
     */
    if (action === "deleteDriveFiles") {
      var fileIds = data.fileIds || [];
      var trashed = [];
      var errors = [];
      for (var di = 0; di < fileIds.length; di++) {
        var fid = String(fileIds[di] || "").trim();
        if (!fid) continue;
        try {
          DriveApp.getFileById(fid).setTrashed(true);
          trashed.push(fid);
        } catch (delErr) {
          errors.push(fid + ": " + String(delErr));
        }
      }
      return jsonOut_({
        ok: true,
        action: "deleteDriveFiles",
        count: trashed.length,
        trashed: trashed,
        errors: errors,
        scriptVersion: SCRIPT_VERSION,
      });
    }

    /**
     * Trash the whole SKU folder under the parent (when a product is deleted).
     */
    if (action === "deleteDriveSkuFolder") {
      var delParentId = String(data.parentFolderId || "").trim() || DEFAULT_DRIVE_PARENT_ID;
      var delSku = String(data.sku || "")
        .trim()
        .replace(/[\\/:*?"<>|]/g, "-");
      if (!delSku) throw new Error("sku is required.");
      var delParent = DriveApp.getFolderById(delParentId);
      var folders = delParent.getFoldersByName(delSku);
      var removedFolders = [];
      while (folders.hasNext()) {
        var fold = folders.next();
        fold.setTrashed(true);
        removedFolders.push(fold.getId());
      }
      return jsonOut_({
        ok: true,
        action: "deleteDriveSkuFolder",
        sku: delSku,
        removedFolders: removedFolders,
        count: removedFolders.length,
        scriptVersion: SCRIPT_VERSION,
      });
    }

    throw new Error("Unknown action: " + action);
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err), scriptVersion: SCRIPT_VERSION });
  }
}
