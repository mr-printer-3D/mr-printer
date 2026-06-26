import type { CatalogProduct } from "@/types";

export const CATALOG: CatalogProduct[] = [
  {
    slug: "happy-cloud-charm-keychain",
    name: "Happy Cloud Charm Keychain",
    subtitle: "Bag Charm Keychain",
    category: "keychains",
    tagline: "Carry a little happiness everywhere!",
    description:
      "An adorable 3D printed cloud buddy with a friendly smile and articulated rain drop legs. Precision-crafted from premium PLA, this lightweight charm is perfect for keys, bags, backpacks, and gifting.",
    material: "Premium non-toxic PLA",
    dimensions: { height: "15 cm", width: "7.5 cm" },
    heroImage: "/products/happy-cloud-charm-keychain/hero.png",
    images: [
      {
        src: "/products/happy-cloud-charm-keychain/hero.png",
        alt: "Happy Cloud Charm Keychain product shot",
      },
      {
        src: "/products/happy-cloud-charm-keychain/features.png",
        alt: "Happy Cloud Charm Keychain features overview",
      },
      {
        src: "/products/happy-cloud-charm-keychain/moments.png",
        alt: "Happy Cloud Charm Keychain use cases",
      },
      {
        src: "/products/happy-cloud-charm-keychain/companion.png",
        alt: "Happy Cloud Charm Keychain on bag",
      },
      {
        src: "/products/happy-cloud-charm-keychain/how-to-use.png",
        alt: "How to use Happy Cloud Charm Keychain",
      },
      {
        src: "/products/happy-cloud-charm-keychain/quality.png",
        alt: "Happy Cloud Charm Keychain quality details",
      },
      {
        src: "/products/happy-cloud-charm-keychain/size.png",
        alt: "Happy Cloud Charm Keychain size guide",
      },
      {
        src: "/products/happy-cloud-charm-keychain/gift.png",
        alt: "Happy Cloud Charm Keychain gift presentation",
      },
    ],
    features: [
      {
        title: "3D Printed",
        description: "Precision 3D printed with high quality PLA.",
      },
      {
        title: "Lightweight & Durable",
        description: "Light to carry, built to last.",
      },
      {
        title: "Moving Rain Drops",
        description: "Cute dangling legs that move and swing.",
      },
      {
        title: "Strong Metal Ring",
        description: "Sturdy metal ring for secure hold.",
      },
      {
        title: "Cute & Unique Design",
        description: "Adorable cloud design that stands out.",
      },
    ],
    highlights: [
      "Cute",
      "Lightweight",
      "Durable",
      "3D Printed",
      "Perfect Gift",
      "Non-Toxic",
      "Premium Quality",
    ],
    useCases: ["Keys", "Bags", "Backpacks", "Pencil Case", "Gifting"],
    steps: [
      {
        title: "Take It",
        description: "Take your cloud buddy from your bag or pocket.",
      },
      {
        title: "Attach It",
        description: "Attach it to your keys, bag, or backpack.",
      },
      {
        title: "Enjoy It",
        description: "Let your cloud buddy brighten your day!",
      },
      {
        title: "Take It Anywhere",
        description: "Lightweight and compact, perfect for on-the-go.",
      },
      {
        title: "Clean It",
        description: "Wipe gently with a soft, damp cloth to keep it clean.",
      },
      {
        title: "Smile Everyday",
        description: "A little cloud, a lot of happiness!",
      },
    ],
  },
];

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG.find((product) => product.slug === slug);
}
