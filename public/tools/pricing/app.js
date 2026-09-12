/* ==========================================================================
   Mr. Printer Studio — Pricing Calculator v2
   Multi-color filament · design · packaging extras · shipping · inventory
   ========================================================================== */

const STORAGE_KEY = "mrPrinterPricingData_v2";
const LEGACY_KEYS = ["mrPrinterPricingData_v1"];

let state = {
  settings: { ...DEFAULT_SETTINGS },
  products: [],
};

let editingId = null;
let sortKey = null;
let sortDir = 1;
let skuManual = false;
let draftColors = []; // [{id, colorId, name, price, weight, swatch}]
let draftCustomPack = []; // [{id, name, cost}]
/** @type {{id:string,url:string,pendingFile?:File,preview?:string}[]} */
let draftImages = [];
let modalImages = [];
let modalProductId = null;
const MAX_PRODUCT_IMAGES = 5;
const PAGE_SIZE = 50;
let catalogPage = 1;
let inventoryPage = 1;

/* ---------------------------- Persistence ---------------------------- */

function migrateProduct(p) {
  const images = normalizeImageList(p.images || p.imageUrls || [
    p.image1,
    p.image2,
    p.image3,
    p.image4,
    p.image5,
  ]);
  return {
    ...p,
    colors: Array.isArray(p.colors) ? p.colors : [],
    images,
    includeDesign: !!p.includeDesign || num(p.designHours) > 0,
    designHours: num(p.designHours),
    designRate: p.designRate != null ? num(p.designRate) : undefined,
    packagingExtras: {
      externalBox: !!(p.packagingExtras && p.packagingExtras.externalBox),
      sticker: !!(p.packagingExtras && p.packagingExtras.sticker),
      ribbon: !!(p.packagingExtras && p.packagingExtras.ribbon),
    },
    packagingCustom: Array.isArray(p.packagingCustom)
      ? p.packagingCustom.map((x) => ({
          id: x.id || "pc-" + Math.random().toString(36).slice(2, 8),
          name: x.name || "",
          cost: num(x.cost),
        }))
      : [],
    shipping: num(p.shipping),
    inventory: {
      ritesh: num(p.inventory && p.inventory.ritesh),
      mayuri: num(p.inventory && p.inventory.mayuri),
    },
  };
}

function normalizeImageList(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((x) => {
      if (!x) return "";
      if (typeof x === "string") return x.trim();
      return String(x.url || x.src || "").trim();
    })
    .filter((u) => /^https?:\/\//i.test(u) || u.startsWith("data:image/"))
    .slice(0, MAX_PRODUCT_IMAGES);
}

function loadState() {
  let raw = localStorage.getItem(STORAGE_KEY);
  let fromLegacy = false;

  if (!raw) {
    for (const key of LEGACY_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) {
        raw = legacy;
        fromLegacy = true;
        break;
      }
    }
  }

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      state.settings = {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        filamentColors: (parsed.settings && parsed.settings.filamentColors) || DEFAULT_FILAMENT_COLORS,
      };
      // Shared sheet URL must always be present for both partners
      if (!String(state.settings.sheetUrl || "").trim()) {
        state.settings.sheetUrl = DEFAULT_SETTINGS.sheetUrl;
      }
      // Force new business defaults when migrating from v1 or settings revision bump
      const needsRefresh =
        fromLegacy || num(state.settings.settingsRevision) < SETTINGS_REVISION;
      if (needsRefresh) {
        state.settings.machineRate = DEFAULT_SETTINGS.machineRate;
        state.settings.elecUnit = DEFAULT_SETTINGS.elecUnit;
        state.settings.failPct = DEFAULT_SETTINGS.failPct;
        state.settings.labourRate = DEFAULT_SETTINGS.labourRate;
        state.settings.packaging = DEFAULT_SETTINGS.packaging;
        state.settings.packExternalBox = DEFAULT_SETTINGS.packExternalBox;
        state.settings.packSticker = DEFAULT_SETTINGS.packSticker;
        state.settings.packRibbon = DEFAULT_SETTINGS.packRibbon;
        state.settings.wastePct = DEFAULT_SETTINGS.wastePct;
        state.settings.watt = DEFAULT_SETTINGS.watt;
        state.settings.maintPct = DEFAULT_SETTINGS.maintPct;
        state.settings.filamentPrice = DEFAULT_SETTINGS.filamentPrice;
        state.settings.filamentColors = DEFAULT_FILAMENT_COLORS.map((c) => ({ ...c }));
        state.settings.sheetUrl = DEFAULT_SETTINGS.sheetUrl;
        state.settings.settingsRevision = SETTINGS_REVISION;
      }
      state.products = (parsed.products || []).map(migrateProduct);
      if (needsRefresh) {
        state.products.forEach((p) => {
          p.packaging = state.settings.packaging;
        });
      }
      saveState();
      return;
    } catch (e) {
      console.warn("Could not parse saved data, reseeding.", e);
    }
  }

  state.settings = {
    ...DEFAULT_SETTINGS,
    filamentColors: DEFAULT_FILAMENT_COLORS.map((c) => ({ ...c })),
  };
  state.products = getDefaultCatalogProducts().map(migrateProduct);
  saveState();
}

function applyCatalogDefaults(products) {
  return products.map(migrateProduct).map((p) => {
    if (p.marginPct == null) p.marginPct = state.settings.marginPct;
    if (p.packaging == null || p.packaging === "") p.packaging = state.settings.packaging;
    return p;
  });
}

/** Restore built-in catalog into LOCAL list (merge) and safely upsert to sheet — never wipe partners. */
async function restoreDefaultCatalog(opts) {
  const silent = !!(opts && opts.silent);
  const push = opts && opts.push !== false;
  // Merge defaults — do NOT wipe custom / partner products already on this device
  const { added, updated } = upsertProductsById(getDefaultCatalogProducts());
  state.settings.catalogRevision = CATALOG_REVISION;
  catalogPage = 1;
  inventoryPage = 1;
  saveState();
  renderCatalog();
  renderInventory();
  if (push && isSheetConnected()) {
    await syncMergePush(true);
    setSharedSyncUi(
      `Restored defaults (merged) · ${added} added, ${updated} updated · sheet safe-merge · ${state.products.length} local`,
      "ok"
    );
  } else {
    setSharedSyncUi(
      `Restored defaults on this device · ${added} added, ${updated} updated · ${state.products.length} total`,
      "ok"
    );
  }
  if (!silent) {
    showToast(`Catalog restored (merged) · ${state.products.length} products`, "success");
  }
}

/** Merge default/extra products by id (add missing + refresh known rows). Keeps other custom products. */
function upsertProductsById(list) {
  const byId = {};
  state.products.forEach((p) => {
    byId[p.id] = p;
  });
  let added = 0;
  let updated = 0;
  applyCatalogDefaults(list).forEach((p) => {
    if (byId[p.id]) {
      Object.assign(byId[p.id], p);
      updated++;
    } else {
      state.products.push(p);
      byId[p.id] = p;
      added++;
    }
  });
  return { added, updated };
}

/** Ensure seed + extras exist, then push shared sheet. */
async function ensureDefaultProductsMerged(opts) {
  const silent = !!(opts && opts.silent);
  const push = opts && opts.push !== false;
  const { added, updated } = upsertProductsById(getDefaultCatalogProducts());
  state.settings.catalogRevision = CATALOG_REVISION;
  catalogPage = 1;
  inventoryPage = 1;
  saveState();
  renderCatalog();
  renderInventory();
  if (push && isSheetConnected()) {
    await syncMergePush(true);
  }
  const msg = `Catalog synced · ${added} added, ${updated} updated · ${state.products.length} total`;
  setSharedSyncUi(msg + " · " + new Date().toLocaleTimeString(), "ok");
  if (!silent) showToast(msg, "success");
  return { added, updated };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------------------------- Pricing Engine ---------------------------- */
/*
  Material (multi-color):
    for each color: cost_i = (weight_i * (1 + waste%/100) / 1000) * pricePerKg_i
    materialCost = sum(cost_i)
    fallback (no colors): same with single weight + filamentPrice

  machineCost      = printHours * machineRate
  electricityCost  = watt/1000 * printHours * elecUnit
  subtotal         = material + machine + electricity
  maintenance      = subtotal * maintPct/100
  failureBuffer    = (subtotal + maintenance) * failPct/100
  postProcessing   = postMin/60 * labourRate
  designCost       = includeDesign ? designHours * designRate : 0
  packagingTotal   = base + optional extras
  shipping         = shipping
  finalTotalCost   = ... + packaging + shipping
  sellingPrice     = finalTotalCost * (1 + marginPct/100)
*/

function getProductRates(p) {
  const s = state.settings;
  // Fixed rates always come from Settings (not editable per product)
  return {
    wastePct: num(s.wastePct),
    filamentPrice: num(s.filamentPrice),
    machineRate: num(s.machineRate),
    watt: num(s.watt),
    elecUnit: num(s.elecUnit),
    maintPct: num(s.maintPct),
    failPct: num(s.failPct),
    labourRate: num(s.labourRate),
    designRate: p.designRate !== "" && p.designRate != null ? num(p.designRate) : num(s.designRate),
    packaging: p.packaging !== "" && p.packaging != null ? num(p.packaging) : num(s.packaging),
    marginPct:
      p.marginPct !== "" && p.marginPct != null
        ? num(p.marginPct)
        : num(s.marginPct),
  };
}

function calcMaterial(p, rates) {
  const colors = Array.isArray(p.colors) ? p.colors.filter((c) => num(c.weight) > 0) : [];
  const wasteMul = 1 + rates.wastePct / 100;

  if (colors.length) {
    let totalWeight = 0;
    let materialCost = 0;
    const lines = colors.map((c) => {
      const w = num(c.weight);
      const withWaste = w * wasteMul;
      const cost = (withWaste / 1000) * num(c.price);
      totalWeight += w;
      materialCost += cost;
      return { name: c.name || "Color", weight: w, price: num(c.price), cost };
    });
    return { totalWeight, waste: totalWeight * (rates.wastePct / 100), materialCost, lines, multi: true };
  }

  const weight = num(p.weight);
  const waste = weight * (rates.wastePct / 100);
  const totalMaterial = weight + waste;
  const materialCost = (totalMaterial / 1000) * rates.filamentPrice;
  return {
    totalWeight: weight,
    waste,
    materialCost,
    lines: [{ name: "Filament", weight, price: rates.filamentPrice, cost: materialCost }],
    multi: false,
  };
}

function calcPackaging(p, rates) {
  const extras = p.packagingExtras || {};
  const s = state.settings;
  const parts = [{ label: "Base packaging", value: rates.packaging }];
  if (extras.externalBox) parts.push({ label: "External box", value: num(s.packExternalBox) });
  if (extras.sticker) parts.push({ label: "Sticker", value: num(s.packSticker) });
  if (extras.ribbon) parts.push({ label: "Ribbon", value: num(s.packRibbon) });
  (p.packagingCustom || []).forEach((item) => {
    if (!item || !String(item.name || "").trim()) return;
    parts.push({ label: item.name, value: num(item.cost) });
  });
  const total = parts.reduce((sum, x) => sum + x.value, 0);
  return { total, parts };
}

function calculate(p) {
  const rates = getProductRates(p);
  const mat = calcMaterial(p, rates);
  const printHours = num(p.printHours);
  const postMin = num(p.postMin);
  const includeDesign = !!p.includeDesign;
  const designHours = num(p.designHours);
  const shipping = num(p.shipping);

  const machineCost = printHours * rates.machineRate;
  const electricityCost = (rates.watt / 1000) * printHours * rates.elecUnit;
  const subtotal = mat.materialCost + machineCost + electricityCost;
  const maintenance = subtotal * (rates.maintPct / 100);
  const failureBuffer = (subtotal + maintenance) * (rates.failPct / 100);
  const postProcessing = (postMin / 60) * rates.labourRate;
  const designCost = includeDesign ? designHours * rates.designRate : 0;
  const pack = calcPackaging(p, rates);

  const finalTotalCost =
    subtotal + maintenance + failureBuffer + postProcessing + designCost + pack.total + shipping;

  const sellingPrice = finalTotalCost * (1 + rates.marginPct / 100);
  const profit = sellingPrice - finalTotalCost;

  const mrpMarkupPct = num(state.settings.mrpMarkupPct);
  const markedUpPrice = sellingPrice * (1 + mrpMarkupPct / 100);
  const autoMrp = roundUpPsychological(markedUpPrice, state.settings.mrpRoundStep, state.settings.mrpOffset);

  const commission = num(state.settings.meeshoCommissionPct);
  const autoMeesho = commission >= 100 ? sellingPrice : sellingPrice / (1 - commission / 100);

  const mrpIsCustom = p.mrp !== null && p.mrp !== undefined && p.mrp !== "";
  const meeshoIsCustom = p.meesho !== null && p.meesho !== undefined && p.meesho !== "";
  const mrp = mrpIsCustom ? num(p.mrp) : autoMrp;
  const meesho = meeshoIsCustom ? num(p.meesho) : autoMeesho;

  const inventory = {
    ritesh: num(p.inventory && p.inventory.ritesh),
    mayuri: num(p.inventory && p.inventory.mayuri),
  };
  inventory.total = inventory.ritesh + inventory.mayuri;

  return {
    ...mat,
    machineCost,
    electricityCost,
    subtotal,
    maintenance,
    failureBuffer,
    postProcessing,
    designCost,
    packagingTotal: pack.total,
    packagingParts: pack.parts,
    shipping,
    finalTotalCost,
    sellingPrice,
    profit,
    autoMrp,
    autoMeesho,
    mrp,
    meesho,
    mrpIsCustom,
    meeshoIsCustom,
    rates,
    inventory,
    includeDesign,
  };
}

function roundUpPsychological(price, step, offset) {
  step = step > 0 ? step : 100;
  offset = isNaN(offset) ? 1 : offset;
  let rounded = Math.ceil(price / step) * step;
  let candidate = rounded - offset;
  if (candidate < price) {
    rounded += step;
    candidate = rounded - offset;
  }
  return candidate;
}

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function inr(n) {
  return "₹" + (isNaN(n) ? 0 : n).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function el(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}

function libraryColorById(id) {
  return (state.settings.filamentColors || []).find((c) => c.id === id);
}

/* ---------------------------- Tabs ---------------------------- */

function showTab(tabName, opts) {
  const allowed = { calculator: 1, catalog: 1, inventory: 1, settings: 1 };
  const name = allowed[tabName] ? tabName : "calculator";

  // Always flip panels via the inline helper first (never blocked by later render errors)
  if (typeof window.__showTab === "function") {
    window.__showTab(name);
  } else {
    const panel = el("tab-" + name);
    if (!panel) return;
    document.querySelectorAll(".tab-btn[data-tab]").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === name);
    });
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    panel.classList.add("active");
  }

  if (!opts || opts.updateHash !== false) {
    const nextHash = "#" + name;
    if (location.hash !== nextHash) {
      try {
        history.replaceState(null, "", nextHash);
      } catch (_) {}
    }
  }

  try {
    if (name === "catalog") renderCatalog();
    if (name === "inventory") renderInventory();
    if (name === "settings") {
      renderSettingsForm();
      renderColorLibrary();
    }
  } catch (err) {
    console.error("Tab render failed:", name, err);
  }
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (_) {}
}

function tabFromHash() {
  const h = String(location.hash || "")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();
  return h || "calculator";
}

document.querySelectorAll(".tab-btn[data-tab]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showTab(btn.dataset.tab);
  });
});

window.addEventListener("hashchange", () => {
  showTab(tabFromHash(), { updateHash: false });
});

/* ---------------------------- Color rows ---------------------------- */

function newColorDraft(pref) {
  const lib = state.settings.filamentColors || DEFAULT_FILAMENT_COLORS;
  const base = pref || lib[0] || { id: "custom", name: "Custom", price: 800, swatch: "#888" };
  return {
    id: "c-" + Date.now() + "-" + Math.floor(Math.random() * 999),
    colorId: base.id,
    name: base.name,
    price: num(base.price),
    weight: "",
    swatch: base.swatch || "#888",
  };
}

function renderColorRows() {
  const list = el("colors-list");
  const lib = state.settings.filamentColors || [];

  if (!draftColors.length) {
    list.innerHTML = `<div class="empty-state" style="padding:24px">No colors yet — add one, or use fallback weight below.</div>`;
  } else {
    list.innerHTML = draftColors
      .map((c, idx) => {
        const options = lib
          .map(
            (lc) =>
              `<option value="${escapeHtml(lc.id)}" ${lc.id === c.colorId ? "selected" : ""}>${escapeHtml(
                lc.name
              )} — ₹${num(lc.price)}/kg</option>`
          )
          .join("");
        return `
        <div class="color-row" data-idx="${idx}">
          <span class="color-swatch" style="background:${escapeHtml(c.swatch || "#ccc")}"></span>
          <select class="color-select" data-field="colorId">${options}
            <option value="__custom__" ${c.colorId === "__custom__" ? "selected" : ""}>Custom…</option>
          </select>
          <input type="number" step="any" data-field="price" value="${c.price}" placeholder="₹/kg" title="Price per kg" ${c.colorId === "__custom__" ? "" : "readonly"} />
          <input type="number" step="any" data-field="weight" value="${c.weight}" placeholder="Weight g" title="Weight (g)" />
          <button type="button" class="color-remove" data-remove="${idx}" title="Remove">×</button>
        </div>`;
      })
      .join("");
  }

  updateColorTotals();
}

function updateColorTotals() {
  const temp = getFormProduct();
  const c = calculate(temp);
  el("colors-total-weight").textContent = c.totalWeight.toFixed(1) + " g";
  el("colors-total-cost").textContent = inr(c.materialCost);
}

el("add-color-btn").addEventListener("click", () => {
  draftColors.push(newColorDraft());
  renderColorRows();
  renderBreakdown();
});

el("colors-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove]");
  if (!btn) return;
  draftColors.splice(num(btn.dataset.remove), 1);
  renderColorRows();
  renderBreakdown();
});

el("colors-list").addEventListener("input", (e) => {
  const row = e.target.closest(".color-row");
  if (!row) return;
  const idx = num(row.dataset.idx);
  const field = e.target.dataset.field;
  if (!draftColors[idx] || !field) return;

  if (field === "colorId") {
    if (e.target.value === "__custom__") {
      draftColors[idx].colorId = "__custom__";
      draftColors[idx].name = "Custom";
    } else {
      const lc = libraryColorById(e.target.value);
      if (lc) {
        draftColors[idx].colorId = lc.id;
        draftColors[idx].name = lc.name;
        draftColors[idx].price = num(lc.price);
        draftColors[idx].swatch = lc.swatch;
        renderColorRows();
      }
    }
  } else if (field === "price") {
    draftColors[idx].price = e.target.value;
  } else if (field === "weight") {
    draftColors[idx].weight = e.target.value;
  }
  updateColorTotals();
  renderBreakdown();
});

/* ---------------------------- Custom packaging ---------------------------- */

function renderCustomPackRows() {
  const list = el("custom-pack-list");
  if (!draftCustomPack.length) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = draftCustomPack
    .map(
      (item, idx) => `
    <div class="custom-pack-row" data-idx="${idx}">
      <input type="text" data-field="name" value="${escapeHtml(item.name)}" placeholder="e.g. Tissue paper" />
      <input type="number" step="any" data-field="cost" value="${item.cost === "" ? "" : item.cost}" placeholder="₹ cost" />
      <button type="button" class="color-remove" data-custom-pack-remove="${idx}" title="Remove">×</button>
    </div>`
    )
    .join("");
}

el("add-custom-pack-btn").addEventListener("click", () => {
  draftCustomPack.push({
    id: "pc-" + Date.now() + "-" + Math.floor(Math.random() * 999),
    name: "",
    cost: "",
  });
  renderCustomPackRows();
  renderBreakdown();
});

el("custom-pack-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-custom-pack-remove]");
  if (!btn) return;
  draftCustomPack.splice(num(btn.dataset.customPackRemove), 1);
  renderCustomPackRows();
  renderBreakdown();
});

el("custom-pack-list").addEventListener("input", (e) => {
  const row = e.target.closest(".custom-pack-row");
  if (!row) return;
  const idx = num(row.dataset.idx);
  const field = e.target.dataset.field;
  if (!draftCustomPack[idx] || !field) return;
  draftCustomPack[idx][field] = e.target.value;
  renderBreakdown();
});

/* ---------------------------- Product images ---------------------------- */

function getDriveFolderId() {
  return String(state.settings.driveFolderId || DEFAULT_SETTINGS.driveFolderId || "").trim();
}

/** Pull a Google Drive file id out of common link shapes. */
function extractDriveFileId(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  let m = s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];
  m = s.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];
  m = s.match(/\/d\/([a-zA-Z0-9_-]{10,})(?:\/|$)/);
  if (m) return m[1];
  return "";
}

/**
 * Drive uc?export=view links often break in <img> (403 / login HTML).
 * Thumbnail + no-referrer is the reliable browser embed.
 */
function toDisplayImageUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (u.startsWith("data:image/") || u.startsWith("blob:")) return u;
  const id = extractDriveFileId(u);
  if (id && /drive\.google\.com|googleusercontent\.com/i.test(u)) {
    return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w1200";
  }
  return u;
}

function imgTag(src, alt) {
  const display = toDisplayImageUrl(src);
  return (
    `<img src="${escapeHtml(display)}" alt="${escapeHtml(alt || "")}" ` +
    `loading="lazy" referrerpolicy="no-referrer" decoding="async" />`
  );
}

function renderImageGrid(containerId, list, opts) {
  const box = el(containerId);
  if (!box) return;
  const canEdit = !opts || opts.editable !== false;
  if (!list.length) {
    box.innerHTML = `<div class="empty-state" style="padding:14px;grid-column:1/-1">No images yet</div>`;
    return;
  }
  box.innerHTML = list
    .map((img, idx) => {
      const src = img.preview || img.url || "";
      return `<div class="image-tile" data-idx="${idx}">
        ${imgTag(src, "Product image " + (idx + 1))}
        ${
          canEdit
            ? `<div class="img-actions">
          <button type="button" data-img-act="replace" data-idx="${idx}">Edit</button>
          <button type="button" class="danger" data-img-act="remove" data-idx="${idx}">Del</button>
        </div>`
            : ""
        }
      </div>`;
    })
    .join("");
}

function renderDraftImages() {
  renderImageGrid("product-images", draftImages, { editable: true });
}

function renderModalImages() {
  renderImageGrid("image-modal-grid", modalImages, { editable: true });
}

async function fileToJpegDataUrl(file, maxSide = 1600, quality = 0.86) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  try {
    bitmap.close();
  } catch (_) {}
  return canvas.toDataURL("image/jpeg", quality);
}

async function uploadPendingImages(sku, list) {
  const pending = list.filter((x) => x.pendingFile || (x.url && x.url.startsWith("data:image/")));
  if (!pending.length) {
    return list.map((x) => x.url).filter((u) => /^https?:\/\//i.test(u));
  }
  const folderId = getDriveFolderId();
  const scriptUrl = getSheetUrl();
  if (!folderId || !scriptUrl) {
    throw new Error("Drive folder / Apps Script URL missing in Settings.");
  }
  const files = [];
  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    let dataUrl = item.url;
    if (item.pendingFile) dataUrl = await fileToJpegDataUrl(item.pendingFile);
    files.push({
      name: `${sku}-${Date.now()}-${i + 1}.jpg`,
      mimeType: "image/jpeg",
      base64: dataUrl,
    });
  }
  const res = await fetch(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "uploadProductImages",
      parentFolderId: folderId,
      sku: String(sku || "product").replace(/[\\/:*?"<>|]/g, "-"),
      files,
    }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error("Drive upload returned non-JSON. Redeploy Apps Script (v8+).");
  }
  if (!data.ok) {
    const err = String(data.error || "Drive upload failed");
    if (/permission|DriveApp|auth\/drive|Authorization/i.test(err)) {
      throw new Error(
        "Google Drive is not authorized on the Apps Script Web App yet.\n\n" +
          "Do ALL of these:\n" +
          "1. Apps Script → Project Settings (gear) → turn ON “Show appsscript.json”\n" +
          "2. Open appsscript.json → add scope https://www.googleapis.com/auth/drive\n" +
          "3. Save → select authorizeDrive → Run ▶ → Allow Drive (fast; if timeout, Run again)\n" +
          "4. Deploy → Manage deployments → Edit → New version → Deploy\n" +
          "5. Settings → Test connection must show Drive: OK (v11+)\n\n" +
          "Also share the Drive parent folder with the SAME Google account that owns the script (Editor).\n\n" +
          err
      );
    }
    throw new Error(err);
  }
  const uploadedUrls = (data.files || []).map((f) => f.url).filter(Boolean);
  const kept = list.filter((x) => /^https?:\/\//i.test(x.url) && !x.pendingFile).map((x) => x.url);
  return normalizeImageList([...kept, ...uploadedUrls]);
}

function addImageUrlToList(list, url) {
  const u = String(url || "").trim();
  if (!/^https?:\/\//i.test(u)) {
    alert("Enter a valid http(s) image URL.");
    return list;
  }
  if (list.length >= MAX_PRODUCT_IMAGES) {
    alert("Maximum " + MAX_PRODUCT_IMAGES + " images per product.");
    return list;
  }
  return list.concat([{ id: "img-" + Date.now(), url: u }]);
}

async function addFilesToList(list, fileList) {
  const files = Array.from(fileList || []);
  let next = list.slice();
  for (const file of files) {
    if (next.length >= MAX_PRODUCT_IMAGES) break;
    if (!file.type.startsWith("image/")) continue;
    const preview = await fileToJpegDataUrl(file, 480, 0.7);
    next.push({
      id: "img-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      url: preview,
      preview,
      pendingFile: file,
    });
  }
  return next.slice(0, MAX_PRODUCT_IMAGES);
}

function openImageModal(productId) {
  const p = state.products.find((x) => x.id === productId);
  if (!p) return;
  modalProductId = productId;
  modalImages = (p.images || []).map((url, i) => ({
    id: "m-" + i,
    url,
    preview: url,
  }));
  el("image-modal-title").textContent = "Images · " + (p.name || p.sku || "Product");
  el("image-modal-sub").textContent = "SKU " + (p.sku || "—") + " · up to " + MAX_PRODUCT_IMAGES + " photos";
  renderModalImages();
  el("image-modal").classList.remove("hidden");
  el("image-modal").setAttribute("aria-hidden", "false");
}

function closeImageModal() {
  modalProductId = null;
  modalImages = [];
  el("image-modal").classList.add("hidden");
  el("image-modal").setAttribute("aria-hidden", "true");
}

/* ---------------------------- Form <-> State ---------------------------- */

function getFormProduct() {
  const includeDesign = el("f-include-design").checked;
  return {
    sku: el("f-sku").value,
    name: el("f-name").value,
    dims: el("f-dims").value,
    weight: el("f-weight").value,
    printHours: el("f-hours").value,
    postMin: el("f-postmin").value,
    marginPct: el("f-margin").value,
    includeDesign,
    designHours: el("f-designhours").value,
    designRate: el("f-designrate").value,
    packaging: el("f-packaging").value,
    shipping: el("f-shipping").value,
    packagingExtras: {
      externalBox: el("f-pack-box").checked,
      sticker: el("f-pack-sticker").checked,
      ribbon: el("f-pack-ribbon").checked,
    },
    packagingCustom: draftCustomPack
      .filter((x) => String(x.name || "").trim() !== "")
      .map((x) => ({
        id: x.id,
        name: String(x.name).trim(),
        cost: num(x.cost),
      })),
    inventory: {
      ritesh: el("f-inv-ritesh").value,
      mayuri: el("f-inv-mayuri").value,
    },
    colors: draftColors
      .filter((c) => num(c.weight) > 0 || c.name)
      .map((c) => ({
        colorId: c.colorId,
        name: c.name,
        price: num(c.price),
        weight: num(c.weight),
        swatch: c.swatch,
      })),
    images: draftImages.map((x) => x.url).filter(Boolean),
    mrp: el("f-mrp").value,
    meesho: el("f-meesho").value,
  };
}

function renderFixedRates() {
  const s = state.settings;
  el("fixed-waste").textContent = num(s.wastePct) + "%";
  el("fixed-machine").textContent = "₹" + num(s.machineRate);
  el("fixed-watt").textContent = String(num(s.watt));
  el("fixed-elec").textContent = "₹" + num(s.elecUnit);
  el("fixed-labour").textContent = "₹" + num(s.labourRate);
  el("fixed-maint").textContent = num(s.maintPct) + "%";
  el("fixed-fail").textContent = num(s.failPct) + "%";
}

function setFormFromDefaults() {
  const s = state.settings;
  el("f-designrate").value = s.designRate;
  el("f-packaging").value = s.packaging;
  el("f-margin").value = s.marginPct;
  el("f-shipping").value = s.shippingDefault;
  el("f-postmin").value = 15;
  updatePackLabels();
  renderFixedRates();
}

function setFormFromProduct(p) {
  el("f-sku").value = p.sku || "";
  el("f-name").value = p.name || "";
  el("f-dims").value = p.dims || "";
  el("f-weight").value = p.weight != null ? p.weight : "";
  el("f-hours").value = p.printHours != null ? p.printHours : "";
  el("f-postmin").value = p.postMin != null ? p.postMin : 15;
  el("f-include-design").checked = !!p.includeDesign;
  el("design-fields").classList.toggle("hidden", !p.includeDesign);
  el("f-designhours").value = p.designHours != null ? p.designHours : 0;
  el("f-designrate").value = p.designRate != null ? p.designRate : state.settings.designRate;
  el("f-packaging").value = p.packaging != null ? p.packaging : state.settings.packaging;
  el("f-margin").value =
    p.marginPct != null && p.marginPct !== "" ? p.marginPct : state.settings.marginPct;
  el("f-shipping").value = p.shipping != null ? p.shipping : 0;
  const ex = p.packagingExtras || {};
  el("f-pack-box").checked = !!ex.externalBox;
  el("f-pack-sticker").checked = !!ex.sticker;
  el("f-pack-ribbon").checked = !!ex.ribbon;
  el("f-inv-ritesh").value = (p.inventory && p.inventory.ritesh) || 0;
  el("f-inv-mayuri").value = (p.inventory && p.inventory.mayuri) || 0;
  el("f-mrp").value = p.mrp == null ? "" : p.mrp;
  el("f-meesho").value = p.meesho == null ? "" : p.meesho;

  draftColors = (p.colors || []).map((c, i) => ({
    id: "c-edit-" + i,
    colorId: c.colorId || "__custom__",
    name: c.name,
    price: num(c.price),
    weight: c.weight,
    swatch: c.swatch || (libraryColorById(c.colorId) || {}).swatch || "#888",
  }));
  draftCustomPack = (p.packagingCustom || []).map((x, i) => ({
    id: x.id || "pc-edit-" + i,
    name: x.name || "",
    cost: x.cost,
  }));
  draftImages = (p.images || []).map((url, i) => ({
    id: "img-edit-" + i,
    url,
    preview: url,
  }));
  renderColorRows();
  renderCustomPackRows();
  renderDraftImages();
  updatePackLabels();
  renderFixedRates();
}

function updatePackLabels() {
  const s = state.settings;
  el("pack-box-label").textContent = inr(s.packExternalBox);
  el("pack-sticker-label").textContent = inr(s.packSticker);
  el("pack-ribbon-label").textContent = inr(s.packRibbon);
}

el("f-include-design").addEventListener("change", () => {
  el("design-fields").classList.toggle("hidden", !el("f-include-design").checked);
  renderBreakdown();
});

/* ---------------------------- Auto SKU ---------------------------- */

function skuBaseFromName(name) {
  const words = String(name || "")
    .trim()
    .split(/[\s\-_]+/)
    .filter(Boolean);
  if (!words.length) return "";
  const initials = words
    .map((w) => {
      const m = w.match(/[A-Za-z0-9]/);
      return m ? m[0].toUpperCase() : "";
    })
    .join("");
  return initials ? "MR" + initials : "";
}

function generateSku(name, excludeId) {
  const base = skuBaseFromName(name);
  if (!base) return "";
  const taken = new Set(
    state.products.filter((p) => p.id !== excludeId).map((p) => String(p.sku || "").toUpperCase())
  );
  if (!taken.has(base.toUpperCase())) return base;
  let n = 1;
  while (n <= 999) {
    const candidate = base + "-" + String(n).padStart(2, "0");
    if (!taken.has(candidate.toUpperCase())) return candidate;
    n++;
  }
  return base + "-" + Date.now();
}

function autoFillSku() {
  if (skuManual) return;
  el("f-sku").value = generateSku(el("f-name").value, editingId);
}

function updateFormTitle() {
  const name = el("f-name").value.trim();
  if (name) {
    el("form-title").textContent = name;
  } else {
    el("form-title").textContent = editingId ? "Edit Product" : "New Product";
  }
}

function clearForm() {
  editingId = null;
  skuManual = false;
  draftColors = [];
  draftCustomPack = [];
  draftImages = [];
  el("product-form").reset();
  el("f-sku").value = "";
  el("f-name").value = "";
  el("f-dims").value = "";
  el("f-weight").value = "";
  el("f-hours").value = "";
  el("f-mrp").value = "";
  el("f-meesho").value = "";
  if (el("f-image-url")) el("f-image-url").value = "";
  el("f-designhours").value = 0;
  el("f-include-design").checked = false;
  el("design-fields").classList.add("hidden");
  el("f-pack-box").checked = false;
  el("f-pack-sticker").checked = false;
  el("f-pack-ribbon").checked = false;
  el("f-inv-ritesh").value = 0;
  el("f-inv-mayuri").value = 0;
  setFormFromDefaults();
  renderColorRows();
  renderCustomPackRows();
  renderDraftImages();
  updateFormTitle();
  el("edit-badge").classList.add("hidden");
  el("save-btn").textContent = "Save to Catalog";
  renderBreakdown();
}

/* ---------------------------- Live Breakdown ---------------------------- */

function renderBreakdown() {
  const p = getFormProduct();
  const c = calculate(p);
  const list = el("breakdown-list");

  const rows = [{ head: "Material" }];
  c.lines.forEach((line) => {
    rows.push({
      label: `${line.name} (${line.weight}g @ ₹${line.price}/kg)`,
      value: inr(line.cost),
    });
  });
  if (c.waste > 0) rows.push({ label: `Waste (${c.rates.wastePct}%)`, value: c.waste.toFixed(2) + " g" });
  rows.push({ label: "Material cost", value: inr(c.materialCost) });
  rows.push({ head: "Machine & electricity" });
  rows.push({ label: "Machine cost", value: inr(c.machineCost) });
  rows.push({ label: "Electricity", value: inr(c.electricityCost) });
  rows.push({ sub: "Subtotal", value: inr(c.subtotal) });
  rows.push({ head: "Buffers" });
  rows.push({ label: `Maintenance (${c.rates.maintPct}%)`, value: inr(c.maintenance) });
  rows.push({ label: `Failure buffer (${c.rates.failPct}%)`, value: inr(c.failureBuffer) });
  rows.push({ head: "Labour, design & pack" });
  rows.push({ label: "Post-processing", value: inr(c.postProcessing) });
  if (c.includeDesign) rows.push({ label: "Design cost", value: inr(c.designCost) });
  c.packagingParts.forEach((part) => rows.push({ label: part.label, value: inr(part.value) }));
  if (c.shipping > 0) rows.push({ label: "Shipping", value: inr(c.shipping) });

  list.innerHTML = rows
    .map((r) => {
      if (r.head) return `<div class="b-row section-head">${r.head}</div>`;
      if (r.sub)
        return `<div class="b-row subtotal"><span class="label">${r.sub}</span><span class="value">${r.value}</span></div>`;
      return `<div class="b-row"><span class="label">${r.label}</span><span class="value">${r.value}</span></div>`;
    })
    .join("");

  el("res-cost").textContent = inr(c.finalTotalCost);
  el("res-price").textContent = inr(c.sellingPrice);
  el("res-profit").textContent = inr(c.profit) + ` (${c.rates.marginPct}%)`;
  el("auto-mrp-label").innerHTML =
    inr(c.mrp) + (c.mrpIsCustom ? '<span class="auto-tag">custom</span>' : '<span class="auto-tag">auto</span>');
  el("auto-meesho-label").innerHTML =
    inr(c.meesho) +
    (c.meeshoIsCustom ? '<span class="auto-tag">custom</span>' : '<span class="auto-tag">auto</span>');

  el("mini-ritesh").textContent = c.inventory.ritesh;
  el("mini-mayuri").textContent = c.inventory.mayuri;
  el("mini-total").textContent = c.inventory.total;
  updateColorTotals();
}

el("product-form").addEventListener("input", (e) => {
  if (e.target && e.target.id === "f-name") {
    autoFillSku();
    updateFormTitle();
  }
  if (e.target && e.target.id === "f-sku") {
    skuManual = el("f-sku").value.trim() !== "";
    if (!skuManual) autoFillSku();
  }
  renderBreakdown();
});

el("product-form").addEventListener("change", renderBreakdown);

/* ---------------------------- Save / Edit / Delete ---------------------------- */

el("product-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const p = getFormProduct();
  if (!p.name || p.printHours === "" || p.weight === "") {
    alert("Please fill in Product Name, Weight (g), and Print Hours.");
    return;
  }

  const colorWeight = (p.colors || []).reduce((s, c) => s + num(c.weight), 0);
  let imageUrls = normalizeImageList(p.images);
  const saveBtn = el("save-btn");
  const prevLabel = saveBtn.textContent;
  try {
    if (draftImages.some((x) => x.pendingFile || String(x.url || "").startsWith("data:image/"))) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Uploading images…";
      const sku = String(p.sku || "").trim() || generateSku(p.name, editingId);
      imageUrls = await uploadPendingImages(sku, draftImages);
    }
  } catch (err) {
    console.error(err);
    alert("Could not upload images: " + (err.message || err));
    saveBtn.disabled = false;
    saveBtn.textContent = prevLabel;
    return;
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = prevLabel;
  }

  const clean = migrateProduct({
    ...p,
    weight: num(p.weight) || colorWeight,
    printHours: num(p.printHours),
    postMin: num(p.postMin),
    designHours: num(p.designHours),
    designRate: num(p.designRate),
    packaging: num(p.packaging),
    shipping: num(p.shipping),
    marginPct: num(p.marginPct),
    packagingCustom: p.packagingCustom || [],
    images: imageUrls,
    mrp: p.mrp === "" ? null : num(p.mrp),
    meesho: p.meesho === "" ? null : num(p.meesho),
    inventory: {
      ritesh: Math.max(0, Math.round(num(p.inventory.ritesh))),
      mayuri: Math.max(0, Math.round(num(p.inventory.mayuri))),
    },
  });

  if (!String(clean.sku || "").trim()) clean.sku = generateSku(clean.name, editingId);

  let savedProduct;
  if (editingId) {
    const idx = state.products.findIndex((x) => x.id === editingId);
    if (idx !== -1) state.products[idx] = savedProduct = { ...clean, id: editingId };
  } else {
    clean.id = "p-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    state.products.push(clean);
    savedProduct = clean;
  }
  saveState();
  clearForm();
  renderCatalog();
  renderInventory();
  showTab("catalog");
  showToast("Product saved locally…", "success");
  void syncUpsert(savedProduct).then((ok) => {
    if (ok) showToast("Product saved to shared sheet", "success");
  });
});

el("clear-btn").addEventListener("click", clearForm);

if (el("add-image-url-btn")) {
  el("add-image-url-btn").addEventListener("click", () => {
    draftImages = addImageUrlToList(draftImages, el("f-image-url").value);
    el("f-image-url").value = "";
    renderDraftImages();
  });
}
if (el("f-image-file")) {
  el("f-image-file").addEventListener("change", async (e) => {
    draftImages = await addFilesToList(draftImages, e.target.files);
    e.target.value = "";
    renderDraftImages();
  });
}
if (el("product-images")) {
  el("product-images").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-img-act]");
    if (!btn) return;
    const idx = num(btn.dataset.idx);
    const act = btn.dataset.imgAct;
    if (act === "remove") {
      draftImages = draftImages.filter((_, i) => i !== idx);
      renderDraftImages();
      return;
    }
    if (act === "replace") {
      const url = prompt("Paste new image URL (or Cancel and use Upload above)", draftImages[idx]?.url || "");
      if (url == null) return;
      if (!/^https?:\/\//i.test(url.trim())) {
        alert("Need a valid http(s) URL.");
        return;
      }
      draftImages[idx] = { id: draftImages[idx].id, url: url.trim(), preview: url.trim() };
      renderDraftImages();
    }
  });
}

if (el("image-modal")) {
  el("image-modal").addEventListener("click", (e) => {
    if (e.target.closest("[data-close-modal]")) closeImageModal();
  });
  el("image-modal-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-img-act]");
    if (!btn) return;
    const idx = num(btn.dataset.idx);
    const act = btn.dataset.imgAct;
    if (act === "remove") {
      modalImages = modalImages.filter((_, i) => i !== idx);
      renderModalImages();
    } else if (act === "replace") {
      const url = prompt("Paste new image URL", modalImages[idx]?.url || "");
      if (url == null) return;
      if (!/^https?:\/\//i.test(url.trim())) {
        alert("Need a valid http(s) URL.");
        return;
      }
      modalImages[idx] = { id: modalImages[idx].id, url: url.trim(), preview: url.trim() };
      renderModalImages();
    }
  });
  el("modal-add-url-btn").addEventListener("click", () => {
    modalImages = addImageUrlToList(modalImages, el("modal-image-url").value);
    el("modal-image-url").value = "";
    renderModalImages();
  });
  el("modal-image-file").addEventListener("change", async (e) => {
    modalImages = await addFilesToList(modalImages, e.target.files);
    e.target.value = "";
    renderModalImages();
  });
  el("modal-save-images-btn").addEventListener("click", async () => {
    if (!modalProductId) return;
    const idx = state.products.findIndex((x) => x.id === modalProductId);
    if (idx === -1) return;
    const p = state.products[idx];
    const btn = el("modal-save-images-btn");
    const prev = btn.textContent;
    try {
      btn.disabled = true;
      btn.textContent = "Saving…";
      const urls = await uploadPendingImages(p.sku || p.name, modalImages);
      state.products[idx] = { ...p, images: urls };
      saveState();
      renderCatalog();
      closeImageModal();
      showToast("Images saved", "success");
      void syncUpsert(state.products[idx]);
    } catch (err) {
      console.error(err);
      alert("Could not save images: " + (err.message || err));
    } finally {
      btn.disabled = false;
      btn.textContent = prev;
    }
  });
}

function startEdit(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  editingId = id;
  setFormFromProduct(p);
  skuManual = !!(p.sku && String(p.sku).trim());
  if (!skuManual) autoFillSku();
  updateFormTitle();
  el("edit-badge").classList.remove("hidden");
  el("save-btn").textContent = "Update Product";
  showTab("calculator");
  renderBreakdown();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function duplicateProduct(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  const copyName = p.name + " (Copy)";
  const copy = migrateProduct({
    ...p,
    id: "p-" + Date.now(),
    name: copyName,
    sku: generateSku(copyName, null),
  });
  state.products.push(copy);
  saveState();
  renderCatalog();
  renderInventory();
  syncUpsert(copy);
}

function deleteProduct(id) {
  if (!confirm("Delete this product from the catalog?")) return;
  state.products = state.products.filter((x) => x.id !== id);
  saveState();
  renderCatalog();
  renderInventory();
  syncDelete(id);
}

el("clear-all-btn").addEventListener("click", () => {
  if (!confirm("This will remove ALL products from the catalog on THIS device. Continue?")) return;
  state.products = [];
  saveState();
  renderCatalog();
  renderInventory();
  if (
    isSheetConnected() &&
    confirm(
      "ALSO wipe the SHARED Google Sheet for everyone (Ritesh/you)?\n\nOnly say OK if you really mean to delete the shared catalog."
    )
  ) {
    syncOverwriteSheet(true);
  }
});

/* ---------------------------- Catalog ---------------------------- */

function colorDots(colors) {
  if (!colors || !colors.length) return "";
  return `<div class="color-tags">${colors
    .map((c) => `<span class="color-tag" title="${escapeHtml(c.name)}" style="background:${escapeHtml(c.swatch || "#999")}"></span>`)
    .join("")}</div>`;
}

function renderPager(containerId, page, totalItems, setPageFn) {
  const box = el(containerId);
  if (!box) return page;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  let safePage = Math.min(Math.max(1, page), totalPages);
  if (totalItems <= PAGE_SIZE) {
    box.hidden = true;
    box.innerHTML = "";
    return 1;
  }
  box.hidden = false;
  const start = (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, totalItems);
  box.innerHTML = `
    <button type="button" class="btn btn-ghost pager-btn" ${safePage <= 1 ? "disabled" : ""} data-pager="-1">Prev</button>
    <span class="pager-info">Page ${safePage} of ${totalPages} · ${start}–${end} of ${totalItems}</span>
    <button type="button" class="btn btn-ghost pager-btn" ${safePage >= totalPages ? "disabled" : ""} data-pager="1">Next</button>
  `;
  box.querySelectorAll("[data-pager]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = num(btn.getAttribute("data-pager"));
      setPageFn(safePage + delta);
    });
  });
  return safePage;
}

function renderCatalog() {
  const body = el("catalog-body");
  if (!body) return;
  const searchEl = el("search-input");
  const query = searchEl ? String(searchEl.value || "").trim().toLowerCase() : "";
  renderStats();

  let rows = state.products.map((p) => ({ p, c: calculate(p) }));
  if (query) {
    rows = rows.filter(
      ({ p }) =>
        p.name.toLowerCase().includes(query) ||
        (p.sku || "").toLowerCase().includes(query) ||
        (p.colors || []).some((c) => (c.name || "").toLowerCase().includes(query))
    );
  }

  if (sortKey) {
    rows.sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (typeof va === "string") return va.localeCompare(vb) * sortDir;
      return (va - vb) * sortDir;
    });
  }

  if (!rows.length) {
    const msg =
      state.products.length === 0
        ? "No products yet. Use Restore catalog, or add one from the Calculator tab."
        : "No products match your search.";
    body.innerHTML = `<tr><td colspan="8"><div class="empty-state">${msg}</div></td></tr>`;
    renderPager("catalog-pager", 1, 0, () => {});
    return;
  }

  catalogPage = renderPager("catalog-pager", catalogPage, rows.length, (p) => {
    catalogPage = p;
    renderCatalog();
  });
  const start = (catalogPage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

  body.innerHTML = pageRows
    .map(({ p, c }) => {
      const margin = c.finalTotalCost > 0 ? ((c.profit / c.finalTotalCost) * 100).toFixed(0) : 0;
      const imgs = p.images || [];
      const thumbs = imgs
        .slice(0, 3)
        .map((u) => imgTag(u, ""))
        .join("");
      const more = imgs.length > 3 ? `<span class="thumb-more">+${imgs.length - 3}</span>` : "";
      return `
      <tr>
        <td>
          <div class="prod-name">${escapeHtml(p.name)}</div>
          <div class="prod-sub">${p.sku ? escapeHtml(p.sku) + " · " : ""}MRP ${inr(c.mrp)}</div>
          ${colorDots(p.colors)}
        </td>
        <td>
          <div class="catalog-thumbs">${thumbs || "<span class='thumb-more'>None</span>"}${more}</div>
          <button type="button" class="btn btn-sm btn-ghost" style="margin-top:6px" onclick="openImageModal('${p.id}')">Images</button>
        </td>
        <td class="muted-cell">${c.totalWeight.toFixed(1)} g</td>
        <td class="muted-cell">${inr(c.finalTotalCost)}</td>
        <td class="price-cell">${inr(c.sellingPrice)}</td>
        <td class="stock-cell">${c.inventory.total}
          <div class="stock-split">R ${c.inventory.ritesh} · M ${c.inventory.mayuri}</div>
        </td>
        <td><span class="margin-pill">${margin}%</span></td>
        <td class="row-actions">
          <button class="icon-btn" title="Edit" onclick="startEdit('${p.id}')">✎</button>
          <button class="icon-btn" title="Duplicate" onclick="duplicateProduct('${p.id}')">❐</button>
          <button class="icon-btn danger" title="Delete" onclick="deleteProduct('${p.id}')">✕</button>
        </td>
      </tr>`;
    })
    .join("");
}

function renderStats() {
  const n = state.products.length;
  el("stat-count").textContent = n;
  if (!n) {
    el("stat-avg-price").textContent = "₹0";
    el("stat-avg-margin").textContent = "0%";
    el("stat-total-value").textContent = "₹0";
    return;
  }
  let totalPrice = 0;
  let totalMarginPct = 0;
  state.products.forEach((p) => {
    const c = calculate(p);
    totalPrice += c.sellingPrice;
    totalMarginPct += c.finalTotalCost > 0 ? (c.profit / c.finalTotalCost) * 100 : 0;
  });
  el("stat-avg-price").textContent = inr(totalPrice / n);
  el("stat-avg-margin").textContent = Math.round(totalMarginPct / n) + "%";
  el("stat-total-value").textContent = inr(totalPrice);
}

function sortValue({ p, c }, key) {
  switch (key) {
    case "name":
      return (p.name || "").toLowerCase();
    case "weight":
      return c.totalWeight;
    case "cost":
      return c.finalTotalCost;
    case "price":
      return c.sellingPrice;
    case "stock":
      return c.inventory.total;
    case "margin":
      return c.finalTotalCost > 0 ? c.profit / c.finalTotalCost : 0;
    default:
      return 0;
  }
}

document.querySelectorAll("#catalog-table thead th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (sortKey === key) sortDir *= -1;
    else {
      sortKey = key;
      sortDir = 1;
    }
    renderCatalog();
  });
});

el("search-input").addEventListener("input", () => {
  catalogPage = 1;
  renderCatalog();
});

if (el("restore-catalog-btn")) {
  el("restore-catalog-btn").addEventListener("click", async () => {
    if (
      !confirm(
        "Add missing built-in products and refresh known seed rows?\n\n" +
          "Safe for partners: does NOT delete custom products you or Ritesh added."
      )
    ) {
      return;
    }
    await restoreDefaultCatalog({ push: true });
  });
}

/* ---------------------------- Inventory tab ---------------------------- */

function renderInventory() {
  let ritesh = 0;
  let mayuri = 0;
  let skusInStock = 0;
  state.products.forEach((p) => {
    const inv = p.inventory || { ritesh: 0, mayuri: 0 };
    ritesh += num(inv.ritesh);
    mayuri += num(inv.mayuri);
    if (num(inv.ritesh) + num(inv.mayuri) > 0) skusInStock++;
  });
  el("inv-stat-total").textContent = ritesh + mayuri;
  el("inv-stat-ritesh").textContent = ritesh;
  el("inv-stat-mayuri").textContent = mayuri;
  el("inv-stat-skus").textContent = skusInStock;

  const q = el("inv-search").value.trim().toLowerCase();
  let products = state.products.slice();
  if (q) {
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q)
    );
  }
  products.sort((a, b) => a.name.localeCompare(b.name));

  const body = el("inventory-body");
  if (!products.length) {
    body.innerHTML = `<tr><td colspan="4"><div class="empty-state">No products to show.</div></td></tr>`;
    renderPager("inventory-pager", 1, 0, () => {});
    return;
  }

  inventoryPage = renderPager("inventory-pager", inventoryPage, products.length, (p) => {
    inventoryPage = p;
    renderInventory();
  });
  const start = (inventoryPage - 1) * PAGE_SIZE;
  const pageProducts = products.slice(start, start + PAGE_SIZE);

  body.innerHTML = pageProducts
    .map((p) => {
      const r = num(p.inventory && p.inventory.ritesh);
      const m = num(p.inventory && p.inventory.mayuri);
      return `
      <tr>
        <td>
          <div class="prod-name">${escapeHtml(p.name)}</div>
          <div class="prod-sub">${escapeHtml(p.sku || "—")}</div>
        </td>
        <td>${stepperHtml(p.id, "ritesh", r)}</td>
        <td>${stepperHtml(p.id, "mayuri", m)}</td>
        <td class="inv-total-cell">${r + m}</td>
      </tr>`;
    })
    .join("");
}

function stepperHtml(id, warehouse, value) {
  return `
    <div class="inv-stepper">
      <button type="button" onclick="adjustInventory('${id}','${warehouse}',-1)">−</button>
      <input type="number" min="0" step="1" value="${value}"
        onchange="setInventory('${id}','${warehouse}', this.value)" />
      <button type="button" onclick="adjustInventory('${id}','${warehouse}',1)">+</button>
    </div>`;
}

let inventorySyncTimer = null;
function queueInventorySync(p) {
  // Debounce so +/- clicks don't spam the sheet
  clearTimeout(inventorySyncTimer);
  inventorySyncTimer = setTimeout(() => {
    syncUpsert(p);
  }, 450);
}

function adjustInventory(id, warehouse, delta) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  if (!p.inventory) p.inventory = { ritesh: 0, mayuri: 0 };
  p.inventory[warehouse] = Math.max(0, num(p.inventory[warehouse]) + delta);
  saveState();
  renderInventory();
  renderCatalog();
  queueInventorySync(p);
}

function setInventory(id, warehouse, value) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  if (!p.inventory) p.inventory = { ritesh: 0, mayuri: 0 };
  p.inventory[warehouse] = Math.max(0, Math.round(num(value)));
  saveState();
  renderInventory();
  renderCatalog();
  queueInventorySync(p);
}

el("inv-search").addEventListener("input", () => {
  inventoryPage = 1;
  renderInventory();
});

el("inv-pull-btn").addEventListener("click", () => {
  ensureSheetUrlSaved();
  syncPullAll({ replace: true, force: true });
});

el("inv-push-btn").addEventListener("click", () => {
  ensureSheetUrlSaved();
  syncMergePush();
});

/* ---------------------------- CSV ---------------------------- */

const CSV_HEADERS = [
  "Product SKU",
  "Product Name",
  "Dimensions (LxWxH) cm",
  "Model Weight (g)",
  "Colors",
  "Print Hours",
  "Post Processing Minutes",
  "Design Hours",
  "Design Rate/hr",
  "Packaging",
  "External Box",
  "Sticker",
  "Ribbon",
  "Other Packaging",
  "Shipping",
  "Profit Margin %",
  "Material Cost",
  "Final Total Cost",
  "Selling Price",
  "MRP",
  "Meesho Selling Price",
  "Stock Ritesh",
  "Stock Mayuri",
];

el("export-btn").addEventListener("click", () => {
  const lines = [CSV_HEADERS.join(",")];
  state.products.forEach((p) => {
    const c = calculate(p);
    const ex = p.packagingExtras || {};
    const colorStr = (p.colors || [])
      .map((x) => `${x.name}:${x.weight}g@${x.price}`)
      .join(" | ");
    const customPack = (p.packagingCustom || [])
      .map((x) => `${x.name}:${x.cost}`)
      .join(" | ");
    const row = [
      p.sku,
      p.name,
      p.dims,
      c.totalWeight,
      colorStr,
      p.printHours,
      p.postMin,
      p.designHours,
      p.designRate,
      p.packaging,
      ex.externalBox ? "Y" : "N",
      ex.sticker ? "Y" : "N",
      ex.ribbon ? "Y" : "N",
      customPack,
      p.shipping,
      p.marginPct,
      c.materialCost.toFixed(4),
      c.finalTotalCost.toFixed(4),
      c.sellingPrice.toFixed(4),
      c.mrp.toFixed(2),
      c.meesho.toFixed(2),
      c.inventory.ritesh,
      c.inventory.mayuri,
    ].map(csvEscape);
    lines.push(row.join(","));
  });
  downloadFile("mr-printer-pricing.csv", lines.join("\n"));
});

const SHOPIFY_CSV_HEADERS = [
  "Title",
  "URL handle",
  "Description",
  "Vendor",
  "Product category",
  "Type",
  "Tags",
  "Published on online store",
  "Status",
  "SKU",
  "Barcode",
  "Option1 name",
  "Option1 value",
  "Option1 Linked To",
  "Option2 name",
  "Option2 value",
  "Option2 Linked To",
  "Option3 name",
  "Option3 value",
  "Option3 Linked To",
  "Price",
  "Compare-at price",
  "Cost per item",
  "Charge tax",
  "Tax code",
  "Unit price total measure",
  "Unit price total measure unit",
  "Unit price base measure",
  "Unit price base measure unit",
  "Inventory tracker",
  "Inventory quantity",
  "Continue selling when out of stock",
  "Weight value (grams)",
  "Weight unit for display",
  "Requires shipping",
  "Fulfillment service",
  "Product image URL",
  "Image position",
  "Image alt text",
  "Variant image URL",
  "Gift card",
  "SEO title",
  "SEO description",
  "Color (product.metafields.shopify.color-pattern)",
  "Google Shopping / Google product category",
  "Google Shopping / Gender",
  "Google Shopping / Age group",
  "Google Shopping / Manufacturer part number (MPN)",
  "Google Shopping / Ad group name",
  "Google Shopping / Ads labels",
  "Google Shopping / Condition",
  "Google Shopping / Custom product",
  "Google Shopping / Custom label 0",
  "Google Shopping / Custom label 1",
  "Google Shopping / Custom label 2",
  "Google Shopping / Custom label 3",
  "Google Shopping / Custom label 4",
];

function shopifySlug(input) {
  return String(input || "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "product";
}

if (el("export-shopify-btn")) {
  el("export-shopify-btn").addEventListener("click", () => {
    const products = (state.products || []).filter((p) => p && String(p.name || "").trim());
    if (!products.length) {
      alert("No products in catalog to export. Save products first, then export.");
      return;
    }
    const lines = [SHOPIFY_CSV_HEADERS.join(",")];
    let exported = 0;
    products.forEach((p) => {
      const c = calculate(p);
      const handle = shopifySlug(p.sku || p.name);
      const colors = (p.colors || []).map((x) => x.name).filter(Boolean);
      const optionColors = colors.length ? colors : ["Default Title"];
      const useColor = !(optionColors.length === 1 && optionColors[0] === "Default Title");
      // Prefer selling price; fall back to Meesho/MRP so every product is listed
      const sell = num(c.sellingPrice) || num(c.meesho) || num(c.mrp) || 0;
      const price = sell.toFixed(2);
      const compare = num(c.mrp) > sell ? num(c.mrp).toFixed(2) : "";
      const stock = (c.inventory.ritesh || 0) + (c.inventory.mayuri || 0);
      const weight = Math.max(1, Math.round(num(c.totalWeight) || num(p.weight) || 50));
      const desc = p.dims
        ? `3D printed product · ${p.dims}`
        : "3D printed product from Mr. Printer Studio";

      optionColors.forEach((color, vi) => {
        const row = SHOPIFY_CSV_HEADERS.map(() => "");
        const set = (key, val) => {
          const i = SHOPIFY_CSV_HEADERS.indexOf(key);
          if (i >= 0) row[i] = val == null ? "" : String(val);
        };
        if (vi === 0) {
          set("Title", p.name);
          set("Description", desc);
          set("Vendor", "Mr. Printer Studio");
          set("Product category", "Home & Garden > Decor");
          set("Type", "3D Printed");
          set("Tags", "3D Print, Mr Printer");
          set("Published on online store", "TRUE");
          set("Status", "Active");
          set("SEO title", String(p.name || "").slice(0, 70));
          set("SEO description", desc.slice(0, 320));
          set(
            "Color (product.metafields.shopify.color-pattern)",
            useColor ? optionColors.join("; ") : ""
          );
          set("Google Shopping / Condition", "New");
          set("Google Shopping / Custom product", "FALSE");
          const imgs = normalizeImageList(p.images);
          if (imgs[0]) {
            set("Product image URL", imgs[0]);
            set("Image position", "1");
            set("Image alt text", p.name);
          }
        }
        set("URL handle", handle);
        set(
          "SKU",
          optionColors.length > 1 ? `${p.sku || handle}-${shopifySlug(color).slice(0, 12)}` : p.sku || handle
        );
        if (useColor) {
          set("Option1 name", "Color");
          set("Option1 value", color);
          set("Option1 Linked To", "product.metafields.shopify.color-pattern");
        } else {
          set("Option1 name", "Title");
          set("Option1 value", "Default Title");
        }
        set("Price", price);
        set("Compare-at price", compare);
        set("Cost per item", num(c.finalTotalCost).toFixed(2));
        set("Charge tax", "TRUE");
        set("Inventory tracker", "shopify");
        set("Inventory quantity", stock);
        set("Continue selling when out of stock", "DENY");
        set("Weight value (grams)", weight);
        set("Weight unit for display", "g");
        set("Requires shipping", "TRUE");
        set("Fulfillment service", "manual");
        set("Gift card", "FALSE");
        lines.push(row.map(csvEscape).join(","));
      });

      normalizeImageList(p.images)
        .slice(1)
        .forEach((url, idx) => {
          const row = SHOPIFY_CSV_HEADERS.map(() => "");
          const set = (key, val) => {
            const i = SHOPIFY_CSV_HEADERS.indexOf(key);
            if (i >= 0) row[i] = val == null ? "" : String(val);
          };
          set("URL handle", handle);
          set("Product image URL", url);
          set("Image position", String(idx + 2));
          set("Image alt text", `${p.name} ${idx + 2}`);
          lines.push(row.map(csvEscape).join(","));
        });

      exported++;
    });
    // BOM helps Excel open UTF-8 Shopify CSV correctly
    downloadFile(
      `shopify-products-${exported}.csv`,
      "\uFEFF" + lines.join("\n")
    );
    showToast(`Shopify listing CSV · ${exported} product(s)`, "success");
  });
}

function csvEscape(v) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

el("import-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const added = importCsv(reader.result);
      saveState();
      renderCatalog();
      renderInventory();
      alert(`Imported ${added} product(s) into the catalog.`);
    } catch (err) {
      alert("Could not import this file.");
      console.error(err);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

function importCsv(text) {
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length < 2) return 0;
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (names) => {
    for (const n of names) {
      const i = header.findIndex((h) => h.includes(n));
      if (i !== -1) return i;
    }
    return -1;
  };
  const col = {
    sku: idx(["product sku", "sku"]),
    name: idx(["product name"]),
    dims: idx(["dimen"]),
    weight: idx(["model weight", "weight"]),
    printHours: idx(["print hours"]),
    postMin: idx(["post processing"]),
    designHours: idx(["design hours"]),
    designRate: idx(["design rate"]),
    packaging: idx(["packaging"]),
    shipping: idx(["shipping"]),
    marginPct: idx(["profit margin"]),
    mrp: idx(["mrp"]),
    meesho: idx(["meesho"]),
    ritesh: idx(["stock ritesh", "ritesh"]),
    mayuri: idx(["stock mayuri", "mayuri"]),
  };

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = col.name !== -1 ? (r[col.name] || "").trim() : "";
    const weight = col.weight !== -1 ? parseFloat(r[col.weight]) : NaN;
    if (!name || isNaN(weight)) continue;
    const g = (key, def = 0) => {
      const i2 = col[key];
      if (i2 === -1 || i2 === undefined) return def;
      const v = parseFloat(r[i2]);
      return isNaN(v) ? def : v;
    };
    state.products.push(
      migrateProduct({
        id: "imp-" + Date.now() + "-" + i,
        sku: col.sku !== -1 ? (r[col.sku] || "").trim() : "",
        name,
        dims: col.dims !== -1 ? (r[col.dims] || "").trim() : "",
        weight,
        printHours: g("printHours"),
        postMin: g("postMin", 15),
        designHours: g("designHours"),
        designRate: g("designRate", state.settings.designRate),
        includeDesign: g("designHours") > 0,
        packaging: g("packaging", state.settings.packaging),
        shipping: g("shipping"),
        marginPct: g("marginPct", state.settings.marginPct),
        mrp: col.mrp !== -1 && r[col.mrp] !== "" ? parseFloat(r[col.mrp]) : null,
        meesho: col.meesho !== -1 && r[col.meesho] !== "" ? parseFloat(r[col.meesho]) : null,
        inventory: { ritesh: g("ritesh"), mayuri: g("mayuri") },
        colors: [],
      })
    );
    count++;
  }
  return count;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch === "\r") {
        /* skip */
      } else field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/* ---------------------------- Settings ---------------------------- */

const settingIds = {
  filamentPrice: "s-filament",
  wastePct: "s-waste",
  machineRate: "s-machinerate",
  watt: "s-watt",
  elecUnit: "s-elecunit",
  maintPct: "s-maint",
  failPct: "s-fail",
  labourRate: "s-labourrate",
  designRate: "s-designrate",
  packaging: "s-packaging",
  packExternalBox: "s-pack-box",
  packSticker: "s-pack-sticker",
  packRibbon: "s-pack-ribbon",
  shippingDefault: "s-shipping",
  marginPct: "s-margin",
  mrpMarkupPct: "s-mrpmarkup",
  mrpRoundStep: "s-mrpstep",
  mrpOffset: "s-mrpoffset",
  meeshoCommissionPct: "s-meeshocommission",
};

function renderSettingsForm() {
  // Keep locked rates pinned to defaults
  state.settings.wastePct = DEFAULT_SETTINGS.wastePct;
  state.settings.machineRate = DEFAULT_SETTINGS.machineRate;
  state.settings.watt = DEFAULT_SETTINGS.watt;
  state.settings.elecUnit = DEFAULT_SETTINGS.elecUnit;
  state.settings.labourRate = DEFAULT_SETTINGS.labourRate;
  state.settings.maintPct = DEFAULT_SETTINGS.maintPct;
  state.settings.failPct = DEFAULT_SETTINGS.failPct;

  for (const key in settingIds) {
    if (el(settingIds[key])) el(settingIds[key]).value = state.settings[key];
  }
  el("s-sheeturl").value = state.settings.sheetUrl || "";
  if (el("s-fixed-waste")) {
    el("s-fixed-waste").textContent = num(state.settings.wastePct) + "%";
    el("s-fixed-machine").textContent = "₹" + num(state.settings.machineRate);
    el("s-fixed-watt").textContent = String(num(state.settings.watt));
    el("s-fixed-elec").textContent = "₹" + num(state.settings.elecUnit);
    el("s-fixed-labour").textContent = "₹" + num(state.settings.labourRate);
    el("s-fixed-maint").textContent = num(state.settings.maintPct) + "%";
    el("s-fixed-fail").textContent = num(state.settings.failPct) + "%";
  }
  updatePackLabels();
  renderFixedRates();
  applyTheme(state.settings.theme || "light");
}

function renderColorLibrary() {
  const box = el("color-library");
  const colors = state.settings.filamentColors || [];
  if (!colors.length) {
    box.innerHTML = `<div class="empty-state" style="padding:20px">No colors in library.</div>`;
    return;
  }
  box.innerHTML = colors
    .map(
      (c, i) => `
    <div class="library-row" data-idx="${i}">
      <input type="color" data-field="swatch" value="${escapeHtml(c.swatch || "#888888")}" />
      <input type="text" data-field="name" value="${escapeHtml(c.name)}" placeholder="Color name" />
      <input type="number" step="any" data-field="price" value="${num(c.price)}" placeholder="₹/kg" />
      <button type="button" class="color-remove" data-lib-remove="${i}">×</button>
    </div>`
    )
    .join("");
}

el("add-library-color-btn").addEventListener("click", () => {
  if (!state.settings.filamentColors) state.settings.filamentColors = [];
  state.settings.filamentColors.push({
    id: "color-" + Date.now(),
    name: "New color",
    price: 800,
    swatch: "#888888",
  });
  saveState();
  renderColorLibrary();
  showToast("Color added — set name & price", "success");
});

el("color-library").addEventListener("input", (e) => {
  const row = e.target.closest(".library-row");
  if (!row) return;
  const idx = num(row.dataset.idx);
  const field = e.target.dataset.field;
  const c = state.settings.filamentColors[idx];
  if (!c || !field) return;
  if (field === "price") c.price = num(e.target.value);
  else c[field] = e.target.value;
  saveState();
  updatePackLabels();
});

el("color-library").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-lib-remove]");
  if (!btn) return;
  state.settings.filamentColors.splice(num(btn.dataset.libRemove), 1);
  saveState();
  renderColorLibrary();
});

el("save-settings-btn").addEventListener("click", () => {
  for (const key in settingIds) {
    state.settings[key] = num(el(settingIds[key]).value);
  }
  // Re-pin locked rates so they can never drift
  state.settings.wastePct = DEFAULT_SETTINGS.wastePct;
  state.settings.machineRate = DEFAULT_SETTINGS.machineRate;
  state.settings.watt = DEFAULT_SETTINGS.watt;
  state.settings.elecUnit = DEFAULT_SETTINGS.elecUnit;
  state.settings.labourRate = DEFAULT_SETTINGS.labourRate;
  state.settings.maintPct = DEFAULT_SETTINGS.maintPct;
  state.settings.failPct = DEFAULT_SETTINGS.failPct;
  state.settings.sheetUrl = el("s-sheeturl").value.trim();
  state.settings.settingsRevision = SETTINGS_REVISION;
  saveState();
  renderSettingsForm();
  updatePackLabels();
  renderFixedRates();
  setFormFromDefaults();
  renderBreakdown();
  const msg = el("settings-saved-msg");
  msg.classList.remove("hidden");
  setTimeout(() => msg.classList.add("hidden"), 2000);
  showToast("Defaults saved", "success");
});

/* ---------------------------- Google Sheet Sync ---------------------------- */

function round2(n) {
  return Math.round((isNaN(n) ? 0 : n) * 100) / 100;
}

function getSheetUrl() {
  const url = (state.settings.sheetUrl || DEFAULT_SETTINGS.sheetUrl || "").trim();
  if (url && state.settings.sheetUrl !== url) {
    state.settings.sheetUrl = url;
  }
  return url;
}

function isSheetConnected() {
  return !!getSheetUrl();
}

function ensureSheetUrlSaved() {
  const fromInput = el("s-sheeturl") ? el("s-sheeturl").value.trim() : "";
  const url = fromInput || getSheetUrl() || DEFAULT_SETTINGS.sheetUrl;
  state.settings.sheetUrl = url;
  if (el("s-sheeturl")) el("s-sheeturl").value = url;
  saveState();
  return url;
}

/** Reset both partners onto the studio default Web App URL (clears stale deployment links). */
function resetToCanonicalSheetUrl() {
  const url = String(DEFAULT_SETTINGS.sheetUrl || "").trim();
  state.settings.sheetUrl = url;
  if (el("s-sheeturl")) el("s-sheeturl").value = url;
  saveState();
  return url;
}

function setSharedSyncUi(message, kind) {
  const bar = el("shared-sync-bar");
  const msg = el("shared-sync-msg");
  if (msg) msg.textContent = message;
  if (bar) {
    bar.classList.toggle("is-ok", kind === "ok");
    bar.classList.toggle("is-error", kind === "error");
    bar.classList.toggle("is-warn", kind === "warn");
  }
  setSyncStatus(message);
}

const REQUIRED_SCRIPT_VERSION = 11;
let syncInFlight = null;
let bootstrapDone = false;

function sheetSyncErrorHint(errMsg) {
  const msg = String(errMsg || "");
  if (/number of rows/i.test(msg) || /does not match/i.test(msg)) {
    return (
      msg +
      "\n\nYour Apps Script Web App is still on the OLD code.\n" +
      "1. Open google-apps-script.js in this project\n" +
      "2. Paste ALL of it into Extensions → Apps Script\n" +
      "3. Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy\n" +
      "4. Settings → Test connection — it must say script v" +
      REQUIRED_SCRIPT_VERSION +
      "+\n" +
      "5. Then Push / Restore catalog again"
    );
  }
  return msg;
}

async function sheetPost(payload) {
  const url = getSheetUrl();
  if (!url) throw new Error("No Google Sheet connected yet.");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error("Sheet returned non-JSON. Redeploy Apps Script Web App (New version).");
  }
  if (!data.ok) throw new Error(data.error || "Sheet sync failed.");
  if (data.scriptVersion != null) state.settings.lastScriptVersion = data.scriptVersion;
  return data;
}

function apiUrl(base) {
  return base + (base.indexOf("?") === -1 ? "?" : "&") + "api=1";
}

async function sheetGetAll() {
  const url = getSheetUrl();
  if (!url) throw new Error("No Google Sheet connected yet.");
  const res = await fetch(apiUrl(url), { method: "GET", cache: "no-store" });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error(
      "Sheet returned non-JSON (often means ?api=1 missing or old Web App). Redeploy Apps Script."
    );
  }
  if (!data.ok) throw new Error(data.error || "Sheet sync failed.");
  const ver = data.scriptVersion != null ? num(data.scriptVersion) : 0;
  state.settings.lastScriptVersion = ver;
  saveState();
  const products = Array.isArray(data.products) ? data.products : [];
  return { products, scriptVersion: ver, raw: data };
}

function productForSync(p) {
  const c = calculate(p);
  const imgs = normalizeImageList(p.images);
  return {
    id: p.id,
    sku: p.sku || "",
    name: p.name || "",
    dims: p.dims || "",
    weight: c.totalWeight,
    colors: JSON.stringify(p.colors || []),
    printHours: num(p.printHours),
    postMin: num(p.postMin),
    designHours: num(p.designHours),
    designRate: num(p.designRate || state.settings.designRate),
    packaging: num(p.packaging),
    shipping: num(p.shipping),
    packagingExtras: JSON.stringify(p.packagingExtras || {}),
    packagingCustom: JSON.stringify(p.packagingCustom || []),
    inventoryRitesh: c.inventory.ritesh,
    inventoryMayuri: c.inventory.mayuri,
    inventoryTotal: c.inventory.total,
    marginPct: num(p.marginPct),
    materialCost: round2(c.materialCost),
    finalTotalCost: round2(c.finalTotalCost),
    sellingPrice: round2(c.sellingPrice),
    mrp: round2(c.mrp),
    mrpSource: c.mrpIsCustom ? "manual" : "auto",
    meesho: round2(c.meesho),
    meeshoSource: c.meeshoIsCustom ? "manual" : "auto",
    image1: imgs[0] || "",
    image2: imgs[1] || "",
    image3: imgs[2] || "",
    image4: imgs[3] || "",
    image5: imgs[4] || "",
  };
}

function remoteToProduct(r) {
  // Repair legacy misaligned seed rows from the sheet
  const colorsRaw = r.colors;
  const colorsIsNumber =
    typeof colorsRaw === "number" ||
    (typeof colorsRaw === "string" &&
      colorsRaw !== "" &&
      !String(colorsRaw).trim().startsWith("[") &&
      !Number.isNaN(Number(colorsRaw)));
  if (colorsIsNumber && num(r.printHours) >= 100) {
    r = {
      ...r,
      colors: "[]",
      printHours: num(r.postMin),
      postMin: num(r.packagingCustom) || 15,
      designHours: num(r.inventoryMayuri) || 0,
      designRate: num(r.inventoryRitesh) || state.settings.designRate,
      packaging: num(r.packaging) || state.settings.packaging,
      shipping: num(r.inventoryTotal) || 0,
      packagingExtras: '{"externalBox":false,"sticker":false,"ribbon":false}',
      packagingCustom: "[]",
      inventoryRitesh: 0,
      inventoryMayuri: 0,
      marginPct: num(r.marginPct) || state.settings.marginPct,
    };
  }

  let colors = [];
  let packagingExtras = { externalBox: false, sticker: false, ribbon: false };
  let packagingCustom = [];
  try {
    if (r.colors) {
      if (Array.isArray(r.colors)) colors = r.colors;
      else if (typeof r.colors === "string" && r.colors.trim().startsWith("["))
        colors = JSON.parse(r.colors);
    }
  } catch (_) {}
  try {
    if (r.packagingExtras)
      packagingExtras =
        typeof r.packagingExtras === "string" ? JSON.parse(r.packagingExtras) : r.packagingExtras;
  } catch (_) {}
  try {
    if (r.packagingCustom)
      packagingCustom =
        typeof r.packagingCustom === "string" ? JSON.parse(r.packagingCustom) : r.packagingCustom;
  } catch (_) {}

  if (!Array.isArray(colors)) colors = [];
  if (!packagingExtras || typeof packagingExtras !== "object") {
    packagingExtras = { externalBox: false, sticker: false, ribbon: false };
  }
  if (!Array.isArray(packagingCustom)) packagingCustom = [];

  return migrateProduct({
    id: r.id != null && String(r.id).trim() !== "" ? String(r.id).trim() : "",
    sku: r.sku || "",
    name: r.name || "",
    dims: r.dims || "",
    weight: num(r.weight),
    colors,
    printHours: num(r.printHours),
    postMin: num(r.postMin),
    designHours: num(r.designHours),
    designRate: num(r.designRate),
    includeDesign: num(r.designHours) > 0,
    packaging: num(r.packaging),
    shipping: num(r.shipping),
    packagingExtras,
    packagingCustom,
    inventory: {
      ritesh: num(
        r.inventoryRitesh != null && r.inventoryRitesh !== ""
          ? r.inventoryRitesh
          : r.stockRitesh != null
            ? r.stockRitesh
            : r.ritesh != null
              ? r.ritesh
              : r["Stock Ritesh"]
      ),
      mayuri: num(
        r.inventoryMayuri != null && r.inventoryMayuri !== ""
          ? r.inventoryMayuri
          : r.stockMayuri != null
            ? r.stockMayuri
            : r.mayuri != null
              ? r.mayuri
              : r["Stock Mayuri"]
      ),
    },
    marginPct: num(r.marginPct) || state.settings.marginPct,
    mrp: r.mrpSource === "manual" ? num(r.mrp) : null,
    meesho: r.meeshoSource === "manual" ? num(r.meesho) : null,
    images: [r.image1, r.image2, r.image3, r.image4, r.image5],
  });
}

let toastTimeout;
function showToast(msg, type) {
  const t = el("toast");
  t.textContent = msg;
  t.className = "toast" + (type ? " " + type : "");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.add("hidden"), 3200);
}

function setSyncStatus(text) {
  const s = el("sync-status");
  if (s) s.textContent = text;
}

async function syncUpsert(p) {
  ensureSheetUrlSaved();
  if (!isSheetConnected()) {
    showToast("Add Google Sheet URL in Settings so partners can see this", "error");
    setSharedSyncUi("Not connected to shared sheet", "error");
    return false;
  }
  try {
    await sheetPost({ action: "upsert", product: productForSync(p) });
    showToast("Saved to shared Google Sheet", "success");
    setSharedSyncUi("Shared sheet updated · " + new Date().toLocaleTimeString(), "ok");
    return true;
  } catch (err) {
    console.error(err);
    showToast("Sheet sync failed — product is only on this device", "error");
    setSharedSyncUi("Sync failed: " + (err.message || "check Apps Script"), "error");
    return false;
  }
}

async function syncDelete(id) {
  ensureSheetUrlSaved();
  if (!isSheetConnected()) return;
  try {
    await sheetPost({ action: "delete", id });
    showToast("Removed from shared Google Sheet", "success");
    setSharedSyncUi("Shared sheet updated · " + new Date().toLocaleTimeString(), "ok");
  } catch (err) {
    console.error(err);
    showToast("Sheet sync failed — check Settings", "error");
    setSharedSyncUi("Sync failed: " + (err.message || "check Apps Script"), "error");
  }
}

/**
 * Safe multi-user push: upsert every local product.
 * Never deletes partners' rows that are only on the sheet.
 */
async function syncMergePush(silent) {
  ensureSheetUrlSaved();
  if (!isSheetConnected()) {
    if (!silent) alert("Add your Google Sheet Web App URL in Settings first.");
    return false;
  }
  setSharedSyncUi("Merging products to shared sheet (safe)…");
  try {
    const products = state.products.map(productForSync);
    try {
      await sheetPost({ action: "upsertMany", products });
    } catch (err) {
      // Old Apps Script without upsertMany — fall back to one-by-one upsert (still no wipe)
      const msg = String(err && err.message ? err.message : err);
      if (!/unknown action|upsertMany/i.test(msg)) throw err;
      for (let i = 0; i < products.length; i++) {
        await sheetPost({ action: "upsert", product: products[i] });
      }
    }
    setSharedSyncUi(
      `Merged ${state.products.length} product(s) · partners’ other rows kept · ${new Date().toLocaleTimeString()}`,
      "ok"
    );
    if (!silent) {
      alert(
        `Merged ${state.products.length} product(s) into the shared sheet.\n\n` +
          "Partners’ products that exist only on the sheet were NOT deleted."
      );
    }
    showToast("Merged to shared sheet", "success");
    return true;
  } catch (err) {
    console.error(err);
    setSharedSyncUi("Sync failed ⚠️ — update Apps Script then retry", "error");
    if (!silent) alert("Could not merge to the sheet: " + sheetSyncErrorHint(err.message));
    return false;
  }
}

/**
 * DANGEROUS: wipe sheet and write only this device's catalog.
 * Only for Clear-all / explicit overwrite — never auto-run.
 */
async function syncOverwriteSheet(silent) {
  ensureSheetUrlSaved();
  if (!isSheetConnected()) {
    if (!silent) alert("Add your Google Sheet Web App URL in Settings first.");
    return false;
  }
  setSharedSyncUi("Overwriting shared sheet…");
  try {
    await sheetPost({ action: "replaceAll", products: state.products.map(productForSync) });
    setSharedSyncUi("Shared sheet overwritten · " + new Date().toLocaleTimeString(), "warn");
    if (!silent) alert(`Overwrote shared sheet with ${state.products.length} product(s) from this device.`);
    showToast("Sheet overwritten", "success");
    return true;
  } catch (err) {
    console.error(err);
    setSharedSyncUi("Overwrite failed ⚠️", "error");
    if (!silent) alert("Could not overwrite sheet: " + sheetSyncErrorHint(err.message));
    return false;
  }
}

/** @deprecated name kept — now safe merge */
async function syncPushAll(silent) {
  return syncMergePush(silent);
}

/**
 * Pull shared catalog.
 * replace=true → sheet is source of truth (manual Pull / Sync).
 * merge=true → remote updates known ids; keeps local-only products (auto tab refresh).
 */
async function syncPullAll(opts) {
  const replace = !!(opts && opts.replace);
  const merge = !!(opts && opts.merge) || !replace;
  const silent = !!(opts && opts.silent);
  const force = !!(opts && opts.force);

  // Serialize pulls so refresh + tab-focus cannot race and wipe the catalog
  if (syncInFlight) {
    try {
      await syncInFlight;
    } catch (_) {}
  }

  const run = (async () => {
    ensureSheetUrlSaved();
    if (!isSheetConnected()) {
      if (!silent) alert("Add your Google Sheet Web App URL in Settings first.");
      setSharedSyncUi("Not connected — paste Apps Script URL in Settings", "error");
      return false;
    }
    setSharedSyncUi(replace ? "Loading shared catalog…" : "Merging from sheet…");
    try {
      const remoteResult = await sheetGetAll();
      const remote = remoteResult.products || [];
      const prevCount = state.products.length;
      const prevById = {};
      state.products.forEach((p) => {
        if (p && p.id) prevById[p.id] = p;
      });

      const nextFromRemote = remote
        .map(remoteToProduct)
        .filter((p) => p && p.id)
        .map((p) => {
          if (!p.id) p.id = "sheet-" + Math.random().toString(36).slice(2, 9);
          return p;
        });

      // Never wipe a good local catalog with empty / broken remote data
      if (!nextFromRemote.length) {
        if (prevCount > 0) {
          setSharedSyncUi(
            `Sheet returned 0 usable products — kept ${prevCount} local · ${new Date().toLocaleTimeString()}`,
            "warn"
          );
          return true;
        }
        setSharedSyncUi("Shared sheet is empty", "warn");
        return true;
      }

      // Guard against partial/corrupt pulls wiping most of the catalog on refresh
      if (
        replace &&
        !force &&
        prevCount >= 10 &&
        nextFromRemote.length < Math.max(5, Math.floor(prevCount * 0.5))
      ) {
        setSharedSyncUi(
          `Ignored suspicious pull (${nextFromRemote.length} vs local ${prevCount}) — kept local catalog`,
          "warn"
        );
        return true;
      }

      if (replace && !merge) {
        state.products = nextFromRemote;
      } else {
        // Merge: sheet wins for shared ids; keep local-only rows on this device
        // (do NOT auto-upload them — that would revive products a partner deleted)
        const remoteIds = {};
        const merged = nextFromRemote.map((p) => {
          remoteIds[p.id] = true;
          const prev = prevById[p.id];
          // Old Apps Script (no image columns) returns empty images — keep local photos
          if (
            prev &&
            Array.isArray(prev.images) &&
            prev.images.length &&
            (!Array.isArray(p.images) || !p.images.length)
          ) {
            return { ...p, images: prev.images };
          }
          return p;
        });
        Object.keys(prevById).forEach((id) => {
          if (!remoteIds[id]) merged.push(prevById[id]);
        });
        state.products = merged;
      }

      catalogPage = 1;
      inventoryPage = 1;
      saveState();
      renderCatalog();
      renderInventory();
      setSharedSyncUi(
        `Shared catalog loaded · ${state.products.length} product(s) · ${new Date().toLocaleTimeString()}`,
        "ok"
      );
      if (!silent) {
        showToast(`Loaded ${state.products.length} shared product(s)`, "success");
      }
      return true;
    } catch (err) {
      console.error(err);
      setSharedSyncUi("Could not reach shared sheet — showing this device only", "error");
      if (!silent) alert("Could not pull from the sheet: " + err.message);
      return false;
    }
  })();

  syncInFlight = run;
  try {
    return await run;
  } finally {
    if (syncInFlight === run) syncInFlight = null;
  }
}

async function bootstrapSharedCatalog() {
  ensureSheetUrlSaved();
  try {
    // Merge pull — never wipe local-only rows; upload them to sheet instead
    let result = await syncPullAll({ merge: true, silent: true });
    // If this device still talks to an old Web App, snap to canonical URL and retry
    if (num(state.settings.lastScriptVersion) < REQUIRED_SCRIPT_VERSION) {
      resetToCanonicalSheetUrl();
      result = await syncPullAll({ merge: true, silent: true, force: true });
    }
    if (!state.products.length) {
      await restoreDefaultCatalog({ silent: true, push: true });
      return;
    }
    if (num(state.settings.catalogRevision) < CATALOG_REVISION) {
      await ensureDefaultProductsMerged({ silent: true, push: true });
    }
  } finally {
    bootstrapDone = true;
  }
}

el("test-connection-btn").addEventListener("click", async () => {
  let url = ensureSheetUrlSaved();
  if (!url) {
    alert("Please paste your Apps Script Web App URL first.");
    return;
  }
  setSyncStatus("Testing connection…");
  try {
    let { products, scriptVersion: ver } = await sheetGetAll();

    // Stale localStorage URL → auto-switch to studio default and retry once
    if (ver < REQUIRED_SCRIPT_VERSION) {
      const canonical = resetToCanonicalSheetUrl();
      if (canonical && canonical !== url) {
        url = canonical;
        ({ products, scriptVersion: ver } = await sheetGetAll());
      }
    }

    let driveOk = false;
    let driveMsg = "not checked";
    try {
      const driveRes = await sheetPost({ action: "pingDrive" });
      driveOk = !!(driveRes && driveRes.drive && driveRes.ok !== false);
      driveMsg = driveOk
        ? `OK (${driveRes.parentName || "folder"})`
        : String(driveRes.error || "Drive denied");
    } catch (driveErr) {
      driveMsg = driveErr.message || "Drive ping failed";
    }

    const verOk = ver >= REQUIRED_SCRIPT_VERSION;
    setSyncStatus(
      verOk
        ? `Connected ✓ v${ver} · Drive: ${driveOk ? "OK" : "NO"}`
        : `Connected — old script v${ver || "?"} · Drive: ${driveOk ? "OK" : "NO"}`
    );
    alert(
      (verOk
        ? `Connected! Apps Script v${ver}.\nProducts: ${products.length}\nDrive: ${driveMsg}\n`
        : `OLD Web App (v${ver || "unknown"}; need v${REQUIRED_SCRIPT_VERSION}+).\nProducts: ${products.length}\nDrive: ${driveMsg}\n`) +
        (driveOk
          ? "\nImage upload should work."
          : "\nDrive NOT authorized. In Apps Script:\n" +
            "1. Project Settings → Show appsscript.json\n" +
            "2. Add scope https://www.googleapis.com/auth/drive\n" +
            "3. Run authorizeDrive → Allow\n" +
            "4. Deploy → New version\n") +
        `\nURL:\n${url}`
    );
  } catch (err) {
    console.error(err);
    setSyncStatus("Connection failed ⚠️");
    alert("Could not connect: " + err.message);
  }
});

el("pull-sheet-btn").addEventListener("click", () => {
  ensureSheetUrlSaved();
  syncPullAll({ replace: true, force: true });
});

el("push-sheet-btn").addEventListener("click", () => {
  ensureSheetUrlSaved();
  if (
    !confirm(
      "Merge this device’s products into the shared sheet?\n\n" +
        "Safe: adds/updates only — does NOT delete products Ritesh (or you) added on another device."
    )
  ) {
    return;
  }
  syncMergePush();
});

if (el("repair-sheet-btn")) {
  el("repair-sheet-btn").addEventListener("click", async () => {
    ensureSheetUrlSaved();
    if (
      !confirm(
        "This will reset sheet headers to the official columns, clear extra columns, then merge all products from this device (no wipe). Continue?"
      )
    )
      return;
    setSharedSyncUi("Repairing sheet columns…");
    try {
      await sheetPost({ action: "repairHeaders" });
      await syncMergePush(true);
      await syncPullAll({ merge: true, silent: true });
      setSharedSyncUi("Sheet columns repaired · catalog merged", "ok");
      alert(
        "Sheet repaired.\n\nAlso paste the latest google-apps-script.js into Apps Script and deploy a new version if you have not yet (need v7+)."
      );
    } catch (err) {
      console.error(err);
      setSharedSyncUi("Repair failed", "error");
      alert(
        "Repair failed: " +
          err.message +
          "\n\nUpdate Apps Script from public/tools/pricing/google-apps-script.js and deploy a new version, then try again."
      );
    }
  });
}

if (el("shared-sync-btn")) {
  el("shared-sync-btn").addEventListener("click", () => {
    ensureSheetUrlSaved();
    syncPullAll({ replace: true, force: true });
  });
}

/* ---------------------------- Theme ---------------------------- */

function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  state.settings.theme = next;
  document.documentElement.setAttribute("data-theme", next);
  document.querySelectorAll("[data-theme-set]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-theme-set") === next);
  });
}

function setTheme(theme) {
  applyTheme(theme);
  saveState();
}

document.querySelectorAll("[data-theme-set]").forEach((btn) => {
  btn.addEventListener("click", () => setTheme(btn.getAttribute("data-theme-set")));
});

/* ---------------------------- Init ---------------------------- */

loadState();
applyTheme(state.settings.theme || "light");
renderSettingsForm();
renderColorLibrary();
clearForm();
renderDraftImages();
renderCatalog();
renderInventory();
ensureSheetUrlSaved();
showTab(tabFromHash(), { updateHash: false });
bootstrapSharedCatalog();

// Re-sync when returning to the tab — merge so neither partner loses local-only rows
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && bootstrapDone) {
    syncPullAll({ merge: true, silent: true });
  }
});

// Expose for inline handlers
window.showTab = showTab;
window.openImageModal = openImageModal;
window.startEdit = startEdit;
window.duplicateProduct = duplicateProduct;
window.deleteProduct = deleteProduct;
window.adjustInventory = adjustInventory;
window.setInventory = setInventory;
