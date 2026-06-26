export const BRAND = {
  name: "MR. Printer",
  tagline: "Made To Be Yours",
  description:
    "Premium 3D printing studio crafting custom products, corporate gifts, and personalized creations with world-class finish.",
  email: "mrmr.printer@gmail.com",
  phone: "+91 86248 80423",
  whatsapp: "+91 86248 80423",
  address: "Baner, Pune, Maharashtra, India",
  instagram:
    "https://www.instagram.com/mr_printer.in/?utm_source=ig_web_button_share_sheet",
  github: "https://github.com/mr-printer-3D",
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Corporate Gifting", href: "/corporate-gifting" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const SERVICES = [
  "Custom 3D Printing",
  "Corporate Gifting",
  "Personalized Gifts",
  "Business Branding",
  "Bulk Manufacturing",
  "Product Prototyping",
  "Home Decor",
  "Name Plates",
  "Keychains",
  "Fridge Magnets",
] as const;

export const WHY_US = [
  {
    title: "Premium Finish",
    description:
      "Every product is crafted with meticulous attention to detail and a flawless surface finish.",
    icon: "sparkles",
  },
  {
    title: "Made in India",
    description:
      "Proudly manufactured locally with world-class quality standards and sustainable practices.",
    icon: "flag",
  },
  {
    title: "Fast Delivery",
    description:
      "Rapid turnaround times without compromising on quality — from prototype to production.",
    icon: "zap",
  },
  {
    title: "Custom Design",
    description:
      "Bespoke designs tailored to your brand identity, vision, and exact specifications.",
    icon: "palette",
  },
  {
    title: "Bulk Orders",
    description:
      "Scalable production for events, corporate campaigns, and large-scale gifting needs.",
    icon: "package",
  },
  {
    title: "Eco Friendly",
    description:
      "Sustainable materials and responsible manufacturing for a greener tomorrow.",
    icon: "leaf",
  },
] as const;

export const PRODUCT_CATEGORIES = [
  {
    id: "keychains",
    title: "Keychains",
    description: "Custom branded keychains with premium 3D printed finishes.",
    gradient: "from-amber-100 to-amber-50",
  },
  {
    id: "name-plates",
    title: "Name Plates",
    description: "Elegant desk and door name plates with personalized engraving.",
    gradient: "from-stone-200 to-stone-100",
  },
  {
    id: "corporate-gifts",
    title: "Corporate Gifts",
    description: "Luxury corporate gifting solutions that leave lasting impressions.",
    gradient: "from-yellow-100 to-amber-50",
  },
  {
    id: "desk-accessories",
    title: "Desk Accessories",
    description: "Premium desk organizers, pen holders, and office essentials.",
    gradient: "from-neutral-200 to-neutral-100",
  },
  {
    id: "miniatures",
    title: "Miniatures",
    description: "Detailed miniature models for collectibles and brand displays.",
    gradient: "from-orange-100 to-amber-50",
  },
  {
    id: "personalized-gifts",
    title: "Personalized Gifts",
    description: "One-of-a-kind gifts crafted uniquely for every recipient.",
    gradient: "from-rose-100 to-amber-50",
  },
] as const;

export const INDUSTRIES = [
  "Jewellery",
  "Fashion",
  "Builders",
  "Hotels",
  "Gyms",
  "Corporate",
  "Real Estate",
  "Events",
  "Restaurants",
  "Schools",
] as const;

export const PROCESS_STEPS = [
  { title: "Idea", description: "Share your vision with us" },
  { title: "Design", description: "We craft the perfect 3D model" },
  { title: "3D Preview", description: "Review and refine your design" },
  { title: "Printing", description: "Precision layer-by-layer production" },
  { title: "Quality Check", description: "Rigorous inspection for perfection" },
  { title: "Delivery", description: "Fast, secure delivery to your door" },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "MR. Printer transformed our corporate gifting strategy. The quality is unmatched — our clients were genuinely impressed.",
    author: "Priya Sharma",
    role: "Marketing Director, Luxe Jewels",
    rating: 5,
  },
  {
    quote:
      "From concept to delivery in under a week. The 3D printed name plates for our hotel rooms are absolutely stunning.",
    author: "Rajesh Mehta",
    role: "General Manager, Grand Horizon Hotels",
    rating: 5,
  },
  {
    quote:
      "We've ordered over 5,000 custom keychains for our gym chain. Consistent quality, every single time.",
    author: "Arjun Patel",
    role: "Founder, Iron Forge Gyms",
    rating: 5,
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "What materials do you use for 3D printing?",
    answer:
      "We use premium PLA, PETG, ABS, and resin materials depending on the application. Each material is selected for durability, finish quality, and environmental impact.",
  },
  {
    question: "What is the minimum order quantity?",
    answer:
      "We accept orders starting from a single piece for personalized items. Bulk orders of 50+ pieces receive special pricing and priority production.",
  },
  {
    question: "How long does production take?",
    answer:
      "Standard orders are completed within 3-5 business days. Rush orders can be accommodated within 24-48 hours for an additional fee.",
  },
  {
    question: "Can you work with my existing design files?",
    answer:
      "Absolutely. We accept STL, OBJ, STEP, and most common 3D file formats. Our design team can also create custom models from your sketches or references.",
  },
  {
    question: "Do you offer design services?",
    answer:
      "Yes. Our in-house design team creates bespoke 3D models from your brand guidelines, logos, or creative briefs at no extra cost for bulk orders.",
  },
  {
    question: "What areas do you deliver to?",
    answer:
      "We deliver pan-India with express shipping options. International shipping is available for corporate and bulk orders.",
  },
] as const;

export const PORTFOLIO_ITEMS = [
  {
    id: 1,
    title: "Happy Cloud Charm Keychain",
    category: "keychains",
    image: "/products/happy-cloud-charm-keychain/hero.png",
    slug: "happy-cloud-charm-keychain",
  },
  {
    id: 2,
    title: "Happy Cloud — Features",
    category: "keychains",
    image: "/products/happy-cloud-charm-keychain/features.png",
    slug: "happy-cloud-charm-keychain",
  },
  {
    id: 3,
    title: "Happy Cloud — Lifestyle",
    category: "keychains",
    image: "/products/happy-cloud-charm-keychain/moments.png",
    slug: "happy-cloud-charm-keychain",
  },
  {
    id: 4,
    title: "Happy Cloud — On Bag",
    category: "keychains",
    image: "/products/happy-cloud-charm-keychain/companion.png",
    slug: "happy-cloud-charm-keychain",
  },
  {
    id: 5,
    title: "Happy Cloud — Quality",
    category: "keychains",
    image: "/products/happy-cloud-charm-keychain/quality.png",
    slug: "happy-cloud-charm-keychain",
  },
  {
    id: 6,
    title: "Happy Cloud — Gift Ready",
    category: "personalized-gifts",
    image: "/products/happy-cloud-charm-keychain/gift.png",
    slug: "happy-cloud-charm-keychain",
  },
  {
    id: 7,
    title: "Baby Flexi Dragon",
    category: "keychains",
    image: "/products/baby-flexi-dragon/hero.png",
    slug: "baby-flexi-dragon",
  },
  {
    id: 8,
    title: "Baby Dragon — Features",
    category: "keychains",
    image: "/products/baby-flexi-dragon/features.png",
    slug: "baby-flexi-dragon",
  },
  {
    id: 9,
    title: "Baby Dragon — On Backpack",
    category: "keychains",
    image: "/products/baby-flexi-dragon/companion.png",
    slug: "baby-flexi-dragon",
  },
  {
    id: 10,
    title: "Baby Dragon — Perfect Gift",
    category: "personalized-gifts",
    image: "/products/baby-flexi-dragon/gift.png",
    slug: "baby-flexi-dragon",
  },
] as const;

export const GALLERY_FILTERS = [
  "All",
  "Keychains",
  "Name Plates",
  "Corporate Gifts",
  "Desk Accessories",
  "Miniatures",
  "Personalized Gifts",
] as const;
