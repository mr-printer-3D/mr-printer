export type ShotId =
  | "hero"
  | "moments"
  | "lifestyle"
  | "features"
  | "quality"
  | "gift"
  | "howto"
  | "dimensions";

export type ColorVariantId = "base" | "pink" | "yellow" | "purple";

export type Callout = {
  id: string;
  label: string;
  detail: string;
};

export type DimensionFields = {
  height: string;
  width: string;
};

export type PackCopy = {
  productName: string;
  tagline: string;
  giftCardText: string;
  dimensions: DimensionFields;
  callouts: Callout[];
  featureBar: string[];
  momentsHeadline: string;
  lifestyleHeadline: string;
  giftHeadline: string;
  howtoHeadline: string;
  sizeHeadline: string;
};

export type GeneratedShot = {
  id: ShotId;
  title: string;
  dataUrl: string;
};

export const SHOT_META: { id: ShotId; title: string; blurb: string }[] = [
  {
    id: "hero",
    title: "1 · Hero",
    blurb: "Pedestal + sky + USP bar (reference style)",
  },
  {
    id: "moments",
    title: "2 · Moments",
    blurb: "Perfect for every moment · 2×2 lifestyle grid",
  },
  {
    id: "lifestyle",
    title: "3 · Lifestyle",
    blurb: "Cute companion on bag · usage icons",
  },
  {
    id: "features",
    title: "4 · Features",
    blurb: "Feature list with dashed pointers",
  },
  {
    id: "quality",
    title: "5 · Quality",
    blurb: "Zoom callouts · premium PLA details",
  },
  {
    id: "gift",
    title: "6 · Gift",
    blurb: "Carry happiness · gift presentation",
  },
  {
    id: "howto",
    title: "7 · How to use",
    blurb: "6 easy steps grid",
  },
  {
    id: "dimensions",
    title: "8 · Size",
    blurb: "Perfect size · dimension arrows",
  },
];

export const DEFAULT_COPY: PackCopy = {
  productName: "Bag Charm Keychain",
  tagline: "A cute companion that brightens your day!",
  giftCardText: "For You — Enjoy the little things!",
  dimensions: { height: "15 cm", width: "7.5 cm" },
  callouts: [
    {
      id: "c1",
      label: "3D Printed",
      detail: "Precision crafted with clean layer detail",
    },
    {
      id: "c2",
      label: "Lightweight & Durable",
      detail: "Easy to carry, built to last everyday",
    },
    {
      id: "c3",
      label: "Articulating Design",
      detail: "Playful moving parts that feel premium",
    },
    {
      id: "c4",
      label: "Strong Metal Ring",
      detail: "Secure clip for bags, keys & backpacks",
    },
    {
      id: "c5",
      label: "Unique Design",
      detail: "One-of-a-kind charm that stands out",
    },
  ],
  featureBar: ["Cute", "Lightweight", "Durable", "3D Printed"],
  momentsHeadline: "PERFECT FOR EVERY MOMENT",
  lifestyleHeadline: "CUTE COMPANION",
  giftHeadline: "CARRY A LITTLE HAPPINESS EVERYWHERE",
  howtoHeadline: "EASY TO USE",
  sizeHeadline: "PERFECT SIZE",
};

export const SIZE = 2000;
