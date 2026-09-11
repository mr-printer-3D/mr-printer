import type { MeeshoProduct, SyncResult } from "./types";

export function mockProducts(): MeeshoProduct[] {
  return [
    {
      id: "mock-1",
      rowIndex: 2,
      sku: "MRPHCCKP1",
      name: "Cloud Charm Keychain",
      description: "Cute 3D-printed bag charm. Lightweight PLA, metal ring.",
      category: "Jewellery Accessories",
      price: 149,
      mrp: 499,
      gst: 18,
      hsn: "3926",
      inventory: 50,
      weightGrams: 23,
      color: "White",
      size: "Free Size",
      imageUrls: [],
      imageFolderHint: "MRPHCCKP1",
      dims: "15x7.5x2.5",
      status: "ready",
      raw: {},
    },
    {
      id: "mock-2",
      rowIndex: 3,
      sku: "MRPKEY02",
      name: "Custom Name Keychain",
      description: "Personalized 3D-printed name keychain.",
      category: "Jewellery Accessories",
      price: 199,
      mrp: 599,
      gst: 18,
      hsn: "3926",
      inventory: 30,
      weightGrams: 28,
      color: "Multi",
      size: "Free Size",
      imageUrls: [],
      imageFolderHint: "MRPKEY02",
      dims: "",
      status: "ready",
      raw: {},
    },
  ];
}

export function mockSync(): SyncResult {
  return {
    mode: "mock",
    products: mockProducts(),
    sheetTitle: "Mock catalog (connect Google to go live)",
    warning:
      "Mock mode — add GOOGLE_API_KEY to fetch your real Sheet + Drive.",
  };
}
