/* ==========================================================================
   Mr. Printer Studio — Automatic Pricing Calculator
   All values are derived automatically from a small set of raw inputs using
   the same formula logic as the original reference spreadsheet.
   ========================================================================== */

const STORAGE_KEY = "mrPrinterPricingData_v1";

let state = {
  settings: { ...DEFAULT_SETTINGS },
  products: [],
};

let editingId = null;
let sortKey = null;
let sortDir = 1;
let skuManual = false; // true once the user types a custom SKU (don't overwrite)

/* ---------------------------- Persistence ---------------------------- */

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      state.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
      state.products = parsed.products || [];
      return;
    } catch (e) {
      console.warn("Could not parse saved data, reseeding.", e);
    }
  }
  // First run: seed with the catalog imported from the original sheet.
  state.settings = { ...DEFAULT_SETTINGS };
  state.products = SEED_PRODUCTS;
  saveState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------------------------- Pricing Engine ---------------------------- */
/*
  Formula (reverse engineered & verified against the original sheet):
    waste            = weight * wastePct / 100
    totalMaterial    = weight + waste
    materialCost     = totalMaterial / 1000 * filamentPrice
    machineCost      = printHours * machineRate
    electricityCost  = watt / 1000 * printHours * elecUnit
    subtotal         = materialCost + machineCost + electricityCost
    maintenance      = subtotal * maintPct / 100
    failureBuffer    = (subtotal + maintenance) * failPct / 100
    postProcessing   = postMin / 60 * labourRate
    designCost       = designHours * designRate
    finalTotalCost   = subtotal + maintenance + failureBuffer + postProcessing + designCost + packaging
    sellingPrice     = finalTotalCost * (1 + marginPct / 100)
*/
function calculate(p) {
  const weight = num(p.weight);
  const wastePct = num(p.wastePct);
  const filamentPrice = num(p.filamentPrice);
  const printHours = num(p.printHours);
  const machineRate = num(p.machineRate);
  const watt = num(p.watt);
  const elecUnit = num(p.elecUnit);
  const maintPct = num(p.maintPct);
  const failPct = num(p.failPct);
  const postMin = num(p.postMin);
  const labourRate = num(p.labourRate);
  const designHours = num(p.designHours);
  const designRate = num(p.designRate);
  const packaging = num(p.packaging);
  const marginPct = num(p.marginPct);

  const waste = weight * (wastePct / 100);
  const totalMaterial = weight + waste;
  const materialCost = (totalMaterial / 1000) * filamentPrice;

  const machineCost = printHours * machineRate;

  const electricityCost = (watt / 1000) * printHours * elecUnit;

  const subtotal = materialCost + machineCost + electricityCost;

  const maintenance = subtotal * (maintPct / 100);
  const failureBuffer = (subtotal + maintenance) * (failPct / 100);

  const postProcessing = (postMin / 60) * labourRate;
  const designCost = designHours * designRate;

  const finalTotalCost =
    subtotal + maintenance + failureBuffer + postProcessing + designCost + packaging;

  const sellingPrice = finalTotalCost * (1 + marginPct / 100);
  const profit = sellingPrice - finalTotalCost;

  // --- Auto MRP: mark up the selling price (e.g. +60%), then round UP to
  // the nearest psychological price point (step=100, offset=1 -> ...,499,
  // 699,799,999,1299,...).
  const mrpMarkupPct = num(state.settings.mrpMarkupPct);
  const markedUpPrice = sellingPrice * (1 + mrpMarkupPct / 100);
  const autoMrp = roundUpPsychological(
    markedUpPrice,
    state.settings.mrpRoundStep,
    state.settings.mrpOffset
  );

  // --- Auto Meesho price: gross up the selling price so that after Meesho
  // deducts its commission %, you still net your full target selling price.
  const commission = num(state.settings.meeshoCommissionPct);
  const autoMeesho = commission >= 100 ? sellingPrice : sellingPrice / (1 - commission / 100);

  const mrpIsCustom = p.mrp !== null && p.mrp !== undefined && p.mrp !== "";
  const meeshoIsCustom = p.meesho !== null && p.meesho !== undefined && p.meesho !== "";
  const mrp = mrpIsCustom ? num(p.mrp) : autoMrp;
  const meesho = meeshoIsCustom ? num(p.meesho) : autoMeesho;

  return {
    waste,
    totalMaterial,
    materialCost,
    machineCost,
    electricityCost,
    subtotal,
    maintenance,
    failureBuffer,
    postProcessing,
    designCost,
    finalTotalCost,
    sellingPrice,
    profit,
    autoMrp,
    autoMeesho,
    mrp,
    meesho,
    mrpIsCustom,
    meeshoIsCustom,
  };
}

// Rounds a price UP to the nearest "step", then subtracts "offset" so the
// result lands on a common psychological price point (e.g. x99, x49...).
// Guarantees the result is never below the input price.
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
  return "₹" + (isNaN(n) ? 0 : n).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

/* ---------------------------- Tabs ---------------------------- */

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "catalog") renderCatalog();
  });
});

/* ---------------------------- Form <-> State ---------------------------- */

const formIds = {
  sku: "f-sku",
  name: "f-name",
  dims: "f-dims",
  weight: "f-weight",
  wastePct: "f-waste",
  filamentPrice: "f-filament",
  printHours: "f-hours",
  machineRate: "f-machinerate",
  watt: "f-watt",
  elecUnit: "f-elecunit",
  maintPct: "f-maint",
  failPct: "f-fail",
  postMin: "f-postmin",
  labourRate: "f-labourrate",
  designHours: "f-designhours",
  designRate: "f-designrate",
  packaging: "f-packaging",
  marginPct: "f-margin",
  mrp: "f-mrp",
  meesho: "f-meesho",
};

function el(id) {
  return document.getElementById(id);
}

function getFormProduct() {
  const p = {};
  for (const key in formIds) {
    const v = el(formIds[key]).value;
    p[key] = v === "" ? "" : v;
  }
  return p;
}

function setFormFromDefaults() {
  const s = state.settings;
  el(formIds.filamentPrice).value = s.filamentPrice;
  el(formIds.wastePct).value = s.wastePct;
  el(formIds.machineRate).value = s.machineRate;
  el(formIds.watt).value = s.watt;
  el(formIds.elecUnit).value = s.elecUnit;
  el(formIds.maintPct).value = s.maintPct;
  el(formIds.failPct).value = s.failPct;
  el(formIds.labourRate).value = s.labourRate;
  el(formIds.designRate).value = s.designRate;
  el(formIds.packaging).value = s.packaging;
  el(formIds.marginPct).value = s.marginPct;
}

function setFormFromProduct(p) {
  for (const key in formIds) {
    const val = p[key];
    el(formIds[key]).value = val === null || val === undefined ? "" : val;
  }
}

/* ---------------------------- Auto SKU ---------------------------- */
/*
  Rule: MR (Mr. Printer) + first letter of each word in the product name.
  Example: "Happy Cloud Charm Keychain" -> MRHCCK
  If that SKU already exists in the catalog, append -01, -02, -03, ...
*/
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
    state.products
      .filter((p) => p.id !== excludeId)
      .map((p) => String(p.sku || "").toUpperCase())
  );

  if (!taken.has(base.toUpperCase())) return base;

  let n = 1;
  while (true) {
    const candidate = base + "-" + String(n).padStart(2, "0");
    if (!taken.has(candidate.toUpperCase())) return candidate;
    n++;
    if (n > 999) return base + "-" + Date.now(); // safety fallback
  }
}

function autoFillSku() {
  if (skuManual) return;
  const name = el(formIds.name).value;
  el(formIds.sku).value = generateSku(name, editingId);
}

function clearForm() {
  editingId = null;
  skuManual = false;
  document.getElementById("product-form").reset();
  el(formIds.sku).value = "";
  el(formIds.name).value = "";
  el(formIds.dims).value = "";
  el(formIds.weight).value = "";
  el(formIds.printHours).value = "";
  el(formIds.mrp).value = "";
  el(formIds.meesho).value = "";
  el(formIds.designHours).value = 0;
  setFormFromDefaults();
  document.getElementById("form-title").textContent = "New Product";
  document.getElementById("edit-badge").classList.add("hidden");
  document.getElementById("save-btn").textContent = "Save to Catalog";
  renderBreakdown();
}

/* ---------------------------- Live Breakdown ---------------------------- */

function renderBreakdown() {
  const p = getFormProduct();
  const c = calculate(p);
  const list = el("breakdown-list");

  const rows = [
    { head: "Material Cost" },
    { label: `Waste (${num(p.wastePct)}%)`, value: c.waste.toFixed(2) + " g" },
    { label: "Total Material", value: c.totalMaterial.toFixed(2) + " g" },
    { label: "Material Cost", value: inr(c.materialCost) },
    { head: "Machine & Electricity" },
    { label: "Machine Cost", value: inr(c.machineCost) },
    { label: "Electricity Cost", value: inr(c.electricityCost) },
    { sub: "Subtotal", value: inr(c.subtotal) },
    { head: "Maintenance & Risk Buffer" },
    { label: `Maintenance (${num(p.maintPct)}%)`, value: inr(c.maintenance) },
    { label: `Failure Buffer (${num(p.failPct)}%)`, value: inr(c.failureBuffer) },
    { head: "Post-Processing, Design & Packaging" },
    { label: "Post-Processing", value: inr(c.postProcessing) },
    { label: "Design Cost", value: inr(c.designCost) },
    { label: "Packaging", value: inr(num(p.packaging)) },
  ];

  list.innerHTML = rows
    .map((r) => {
      if (r.head) return `<div class="b-row section-head">${r.head}</div>`;
      if (r.sub) return `<div class="b-row subtotal"><span class="label">${r.sub}</span><span class="value">${r.value}</span></div>`;
      return `<div class="b-row"><span class="label">${r.label}</span><span class="value">${r.value}</span></div>`;
    })
    .join("");

  el("res-cost").textContent = inr(c.finalTotalCost);
  el("res-price").textContent = inr(c.sellingPrice);
  el("res-profit").textContent = inr(c.profit) + ` (${num(p.marginPct)}%)`;

  el("auto-mrp-label").innerHTML = inr(c.mrp) + (c.mrpIsCustom ? '<span class="auto-tag">custom</span>' : '<span class="auto-tag">auto</span>');
  el("auto-meesho-label").innerHTML = inr(c.meesho) + (c.meeshoIsCustom ? '<span class="auto-tag">custom</span>' : '<span class="auto-tag">auto</span>');
}

document.getElementById("product-form").addEventListener("input", (e) => {
  if (e.target && e.target.id === formIds.name) {
    autoFillSku();
  }
  if (e.target && e.target.id === formIds.sku) {
    // User typed/cleared SKU manually — lock auto-fill unless they clear it
    skuManual = el(formIds.sku).value.trim() !== "";
    if (!skuManual) autoFillSku();
  }
  renderBreakdown();
});

/* ---------------------------- Save / Edit / Delete ---------------------------- */

document.getElementById("product-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const p = getFormProduct();
  if (!p.name || p.weight === "" || p.printHours === "") {
    alert("Please fill in at least Product Name, Weight, and Print Hours.");
    return;
  }

  // Normalize numeric fields, keep sku/name/dims/mrp/meesho as-is (mrp/meesho optional).
  const numericKeys = [
    "weight","wastePct","filamentPrice","printHours","machineRate","watt",
    "elecUnit","maintPct","failPct","postMin","labourRate","designHours",
    "designRate","packaging","marginPct",
  ];
  const clean = { ...p };
  numericKeys.forEach((k) => (clean[k] = num(p[k])));
  clean.mrp = p.mrp === "" ? null : num(p.mrp);
  clean.meesho = p.meesho === "" ? null : num(p.meesho);

  // Always ensure a SKU exists (auto if blank)
  if (!String(clean.sku || "").trim()) {
    clean.sku = generateSku(clean.name, editingId);
  }

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
  syncUpsert(savedProduct);

  // Switch to catalog so the user sees the saved product.
  document.querySelector('.tab-btn[data-tab="catalog"]').click();
});

document.getElementById("clear-btn").addEventListener("click", clearForm);

function startEdit(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  editingId = id;
  setFormFromProduct(p);
  // Keep existing SKU while editing; if empty, auto-generate from name
  skuManual = !!(p.sku && String(p.sku).trim());
  if (!skuManual) autoFillSku();
  document.getElementById("form-title").textContent = "Edit Product";
  document.getElementById("edit-badge").classList.remove("hidden");
  document.getElementById("save-btn").textContent = "Update Product";
  document.querySelector('.tab-btn[data-tab="calculator"]').click();
  renderBreakdown();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function duplicateProduct(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  const copyName = p.name + " (Copy)";
  const copy = {
    ...p,
    id: "p-" + Date.now(),
    name: copyName,
    sku: generateSku(copyName, null),
  };
  state.products.push(copy);
  saveState();
  renderCatalog();
  syncUpsert(copy);
}

function deleteProduct(id) {
  if (!confirm("Delete this product from the catalog?")) return;
  state.products = state.products.filter((x) => x.id !== id);
  saveState();
  renderCatalog();
  syncDelete(id);
}

document.getElementById("clear-all-btn").addEventListener("click", () => {
  if (!confirm("This will remove ALL products from the catalog. Continue?")) return;
  state.products = [];
  saveState();
  renderCatalog();
  if (isSheetConnected() && confirm("Also clear all rows in the connected Google Sheet?")) {
    syncPushAll(true);
  }
});

/* ---------------------------- Catalog Table ---------------------------- */

function renderCatalog() {
  const body = el("catalog-body");
  const query = el("search-input").value.trim().toLowerCase();

  renderStats();

  let rows = state.products.map((p) => ({ p, c: calculate(p) }));

  if (query) {
    rows = rows.filter(
      ({ p }) =>
        p.name.toLowerCase().includes(query) || (p.sku || "").toLowerCase().includes(query)
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

  if (rows.length === 0) {
    const msg = state.products.length === 0
      ? "No products yet. Add one from the Calculator tab, or import your existing CSV."
      : "No products match your search.";
    body.innerHTML = `<tr><td colspan="6"><div class="empty-state">📦<br>${msg}</div></td></tr>`;
    return;
  }

  body.innerHTML = rows
    .map(({ p, c }) => {
      const margin = c.finalTotalCost > 0 ? ((c.profit / c.finalTotalCost) * 100).toFixed(0) : 0;
      return `
      <tr>
        <td>
          <div class="prod-name">${escapeHtml(p.name)}</div>
          <div class="prod-sub">${p.sku ? escapeHtml(p.sku) + " · " : ""}MRP ${inr(c.mrp)} · Meesho ${inr(c.meesho)}</div>
        </td>
        <td class="muted-cell">${num(p.weight).toFixed(1)} g</td>
        <td class="muted-cell">${inr(c.finalTotalCost)}</td>
        <td class="price-cell">${inr(c.sellingPrice)}</td>
        <td><span class="margin-pill">${margin}%</span></td>
        <td class="row-actions">
          <button class="icon-btn" title="Edit" onclick="startEdit('${p.id}')">✏️</button>
          <button class="icon-btn" title="Duplicate" onclick="duplicateProduct('${p.id}')">📄</button>
          <button class="icon-btn danger" title="Delete" onclick="deleteProduct('${p.id}')">🗑️</button>
        </td>
      </tr>`;
    })
    .join("");
}

function renderStats() {
  const n = state.products.length;
  el("stat-count").textContent = n;

  if (n === 0) {
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
    case "sku": return (p.sku || "").toLowerCase();
    case "name": return (p.name || "").toLowerCase();
    case "weight": return num(p.weight);
    case "cost": return c.finalTotalCost;
    case "price": return c.sellingPrice;
    case "margin": return c.finalTotalCost > 0 ? c.profit / c.finalTotalCost : 0;
    default: return 0;
  }
}

document.querySelectorAll("#catalog-table thead th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (sortKey === key) sortDir *= -1;
    else { sortKey = key; sortDir = 1; }
    renderCatalog();
  });
});

el("search-input").addEventListener("input", renderCatalog);

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

/* ---------------------------- CSV Export / Import ---------------------------- */

const CSV_HEADERS = [
  "Product SKU","Product Name","Dimensions (LxWxH) cm","Model Weight (g)","Waste %",
  "Filament Price/kg","Print Hours","Machine Rate/hr","Printer Watt","Electricity Unit",
  "Maintenance %","Failure Buffer %","Post Processing Minutes","Labour Rate/hr",
  "Design Hours","Design Rate/hr","Packaging","Profit Margin %",
  "Material Cost","Machine Cost","Electricity Cost","Subtotal","Maintenance ₹",
  "Failure Buffer ₹","Post Processing ₹","Design Cost ₹","Final Total Cost",
  "Selling Price","MRP","MRP Source","Meesho Selling Price","Meesho Price Source",
];

document.getElementById("export-btn").addEventListener("click", () => {
  const lines = [CSV_HEADERS.join(",")];
  state.products.forEach((p) => {
    const c = calculate(p);
    const row = [
      p.sku, p.name, p.dims, p.weight, p.wastePct, p.filamentPrice, p.printHours,
      p.machineRate, p.watt, p.elecUnit, p.maintPct, p.failPct, p.postMin,
      p.labourRate, p.designHours, p.designRate, p.packaging, p.marginPct,
      c.materialCost.toFixed(4), c.machineCost.toFixed(4), c.electricityCost.toFixed(4),
      c.subtotal.toFixed(4), c.maintenance.toFixed(4), c.failureBuffer.toFixed(4),
      c.postProcessing.toFixed(4), c.designCost.toFixed(4), c.finalTotalCost.toFixed(4),
      c.sellingPrice.toFixed(4),
      c.mrp.toFixed(2), c.mrpIsCustom ? "manual" : "auto",
      c.meesho.toFixed(2), c.meeshoIsCustom ? "manual" : "auto",
    ].map(csvEscape);
    lines.push(row.join(","));
  });
  downloadFile("mr-printer-pricing.csv", lines.join("\n"));
});

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

document.getElementById("import-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const added = importCsv(reader.result);
      saveState();
      renderCatalog();
      if (isSheetConnected() && added > 0 && confirm(`Imported ${added} product(s). Also push the full catalog to your connected Google Sheet now?`)) {
        syncPushAll();
      } else {
        alert(`Imported ${added} product(s) into the catalog.`);
      }
    } catch (err) {
      alert("Could not import this file. Please check it's a valid CSV export from this tool or your original sheet.");
      console.error(err);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

// Flexible import: works with either this tool's export, or the original
// reference sheet's column layout (extra computed columns are ignored and
// recalculated automatically).
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
    weight: idx(["model weight"]),
    filamentPrice: idx(["filament price"]),
    printHours: idx(["print hours"]),
    machineRate: idx(["machine rate"]),
    watt: idx(["printer watt"]),
    elecUnit: idx(["electricity unit"]),
    maintPct: idx(["maintenance %"]),
    failPct: idx(["failure buffer %"]),
    postMin: idx(["post processing minutes"]),
    labourRate: idx(["labour rate"]),
    designHours: idx(["design hours"]),
    designRate: idx(["design rate"]),
    packaging: idx(["packaging"]),
    marginPct: idx(["profit margin"]),
    mrp: idx(["mrp"]),
    meesho: idx(["meesho"]),
    wastePct: idx(["waste %", "waste"]),
  };

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = col.name !== -1 ? (r[col.name] || "").trim() : "";
    const weight = col.weight !== -1 ? parseFloat(r[col.weight]) : NaN;
    if (!name || isNaN(weight)) continue; // skip blank/spacer rows

    const g = (key, def = 0) => {
      const i2 = col[key];
      if (i2 === -1 || i2 === undefined) return def;
      const v = parseFloat(r[i2]);
      return isNaN(v) ? def : v;
    };

    const product = {
      id: "imp-" + Date.now() + "-" + i,
      sku: col.sku !== -1 ? (r[col.sku] || "").trim() : "",
      name,
      dims: col.dims !== -1 ? (r[col.dims] || "").trim() : "",
      weight,
      wastePct: g("wastePct", state.settings.wastePct),
      filamentPrice: g("filamentPrice", state.settings.filamentPrice),
      printHours: g("printHours"),
      machineRate: g("machineRate", state.settings.machineRate),
      watt: g("watt", state.settings.watt),
      elecUnit: g("elecUnit", state.settings.elecUnit),
      maintPct: g("maintPct", state.settings.maintPct),
      failPct: g("failPct", state.settings.failPct),
      postMin: g("postMin"),
      labourRate: g("labourRate", state.settings.labourRate),
      designHours: g("designHours"),
      designRate: g("designRate", state.settings.designRate),
      packaging: g("packaging", state.settings.packaging),
      marginPct: g("marginPct", state.settings.marginPct),
      mrp: col.mrp !== -1 && r[col.mrp] !== "" ? parseFloat(r[col.mrp]) : null,
      meesho: col.meesho !== -1 && r[col.meesho] !== "" ? parseFloat(r[col.meesho]) : null,
    };
    state.products.push(product);
    count++;
  }
  return count;
}

// Minimal RFC4180-ish CSV parser (handles quoted fields with commas/newlines).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (ch === "\r") { /* skip */ }
      else field += ch;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
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
  marginPct: "s-margin",
  mrpMarkupPct: "s-mrpmarkup",
  mrpRoundStep: "s-mrpstep",
  mrpOffset: "s-mrpoffset",
  meeshoCommissionPct: "s-meeshocommission",
};

function renderSettingsForm() {
  for (const key in settingIds) {
    el(settingIds[key]).value = state.settings[key];
  }
  el("s-sheeturl").value = state.settings.sheetUrl || "";
}

document.getElementById("save-settings-btn").addEventListener("click", () => {
  for (const key in settingIds) {
    state.settings[key] = num(el(settingIds[key]).value);
  }
  state.settings.sheetUrl = el("s-sheeturl").value.trim();
  saveState();
  const msg = el("settings-saved-msg");
  msg.classList.remove("hidden");
  setTimeout(() => msg.classList.add("hidden"), 2000);
});

/* ---------------------------- Google Sheet Sync ---------------------------- */
/*
  Since this is a plain static page with no backend, we can't talk to the
  Google Sheets API directly (that needs OAuth + a server). Instead this
  connects to a small Google Apps Script "Web App" (see google-apps-script.js)
  that you deploy once from inside your sheet — it exposes GET (read all
  rows) and POST (upsert / delete / replaceAll) over plain HTTPS, acting as
  a lightweight bridge between this tool and your spreadsheet.
*/

function round2(n) {
  return Math.round((isNaN(n) ? 0 : n) * 100) / 100;
}

function getSheetUrl() {
  return (state.settings.sheetUrl || "").trim();
}

function isSheetConnected() {
  return !!getSheetUrl();
}

function ensureSheetUrlSaved() {
  const url = el("s-sheeturl").value.trim();
  state.settings.sheetUrl = url;
  saveState();
  return url;
}

// Note: Content-Type is deliberately "text/plain" (not "application/json").
// Google Apps Script Web Apps can't respond to the CORS preflight (OPTIONS)
// request that browsers send for "application/json" POSTs, so using a
// simple content type avoids the preflight entirely. Apps Script still
// parses the JSON string fine via e.postData.contents.
async function sheetPost(payload) {
  const url = getSheetUrl();
  if (!url) throw new Error("No Google Sheet connected yet.");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Sheet sync failed.");
  return data;
}

function apiUrl(base) {
  // Hub page is served at /exec — pricing JSON API is /exec?api=1
  return base + (base.indexOf("?") === -1 ? "?" : "&") + "api=1";
}

async function sheetGetAll() {
  const url = getSheetUrl();
  if (!url) throw new Error("No Google Sheet connected yet.");
  const res = await fetch(apiUrl(url), { method: "GET" });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Sheet sync failed.");
  return data.products || [];
}

function productForSync(p) {
  const c = calculate(p);
  return {
    id: p.id, sku: p.sku || "", name: p.name || "", dims: p.dims || "",
    weight: num(p.weight), wastePct: num(p.wastePct), filamentPrice: num(p.filamentPrice),
    printHours: num(p.printHours), machineRate: num(p.machineRate), watt: num(p.watt),
    elecUnit: num(p.elecUnit), maintPct: num(p.maintPct), failPct: num(p.failPct),
    postMin: num(p.postMin), labourRate: num(p.labourRate), designHours: num(p.designHours),
    designRate: num(p.designRate), packaging: num(p.packaging), marginPct: num(p.marginPct),
    materialCost: round2(c.materialCost), machineCost: round2(c.machineCost),
    electricityCost: round2(c.electricityCost), subtotal: round2(c.subtotal),
    maintenance: round2(c.maintenance), failureBuffer: round2(c.failureBuffer),
    postProcessing: round2(c.postProcessing), designCost: round2(c.designCost),
    finalTotalCost: round2(c.finalTotalCost), sellingPrice: round2(c.sellingPrice),
    mrp: round2(c.mrp), mrpSource: c.mrpIsCustom ? "manual" : "auto",
    meesho: round2(c.meesho), meeshoSource: c.meeshoIsCustom ? "manual" : "auto",
  };
}

function remoteToProduct(r) {
  return {
    id: r.id, sku: r.sku || "", name: r.name || "", dims: r.dims || "",
    weight: num(r.weight), wastePct: num(r.wastePct), filamentPrice: num(r.filamentPrice),
    printHours: num(r.printHours), machineRate: num(r.machineRate), watt: num(r.watt),
    elecUnit: num(r.elecUnit), maintPct: num(r.maintPct), failPct: num(r.failPct),
    postMin: num(r.postMin), labourRate: num(r.labourRate), designHours: num(r.designHours),
    designRate: num(r.designRate), packaging: num(r.packaging), marginPct: num(r.marginPct),
    mrp: r.mrpSource === "manual" ? num(r.mrp) : null,
    meesho: r.meeshoSource === "manual" ? num(r.meesho) : null,
  };
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
  if (!isSheetConnected()) return;
  try {
    await sheetPost({ action: "upsert", product: productForSync(p) });
    showToast("✓ Synced to Google Sheet", "success");
  } catch (err) {
    console.error(err);
    showToast("⚠ Sheet sync failed — check Settings", "error");
  }
}

async function syncDelete(id) {
  if (!isSheetConnected()) return;
  try {
    await sheetPost({ action: "delete", id });
    showToast("✓ Removed from Google Sheet", "success");
  } catch (err) {
    console.error(err);
    showToast("⚠ Sheet sync failed — check Settings", "error");
  }
}

async function syncPushAll(silent) {
  if (!isSheetConnected()) {
    alert("Add your Google Sheet Web App URL in Settings first.");
    return;
  }
  setSyncStatus("Pushing all products…");
  try {
    await sheetPost({ action: "replaceAll", products: state.products.map(productForSync) });
    setSyncStatus("Connected ✓");
    if (!silent) alert(`Pushed ${state.products.length} product(s) to the sheet.`);
    showToast("✓ Pushed full catalog to Google Sheet", "success");
  } catch (err) {
    console.error(err);
    setSyncStatus("Sync failed ⚠️");
    alert("Could not push to the sheet: " + err.message);
  }
}

async function syncPullAll() {
  if (!isSheetConnected()) {
    alert("Add your Google Sheet Web App URL in Settings first.");
    return;
  }
  setSyncStatus("Pulling from sheet…");
  try {
    const remote = await sheetGetAll();
    const byId = {};
    state.products.forEach((p) => (byId[p.id] = p));
    let added = 0, updated = 0;
    remote.forEach((r) => {
      const product = remoteToProduct(r);
      if (byId[product.id]) {
        Object.assign(byId[product.id], product);
        updated++;
      } else {
        state.products.push(product);
        added++;
      }
    });
    saveState();
    renderCatalog();
    setSyncStatus("Connected ✓");
    alert(`Pulled from sheet: ${added} new, ${updated} updated.`);
  } catch (err) {
    console.error(err);
    setSyncStatus("Sync failed ⚠️");
    alert("Could not pull from the sheet: " + err.message);
  }
}

document.getElementById("test-connection-btn").addEventListener("click", async () => {
  const url = ensureSheetUrlSaved();
  if (!url) {
    alert("Please paste your Apps Script Web App URL first.");
    return;
  }
  setSyncStatus("Testing connection…");
  try {
    const products = await sheetGetAll();
    setSyncStatus("Connected ✓");
    alert(`Connected successfully! Found ${products.length} existing product row(s) in the sheet.`);
  } catch (err) {
    console.error(err);
    setSyncStatus("Connection failed ⚠️");
    alert("Could not connect: " + err.message);
  }
});

document.getElementById("pull-sheet-btn").addEventListener("click", () => {
  ensureSheetUrlSaved();
  syncPullAll();
});

document.getElementById("push-sheet-btn").addEventListener("click", () => {
  ensureSheetUrlSaved();
  syncPushAll();
});

/* ---------------------------- Init ---------------------------- */

loadState();
renderSettingsForm();
clearForm();
renderCatalog();
