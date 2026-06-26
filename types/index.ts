export interface NavLink {
  label: string;
  href: string;
}

export interface ProductCategory {
  id: string;
  title: string;
  description: string;
  gradient: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  rating: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  image: string;
  slug?: string;
}

export interface CatalogProduct {
  slug: string;
  name: string;
  subtitle: string;
  category: string;
  tagline: string;
  description: string;
  material: string;
  dimensions: { height: string; width: string };
  heroImage: string;
  accentColor: string;
  cardDescription: string;
  images: { src: string; alt: string }[];
  features: { title: string; description: string }[];
  highlights: string[];
  useCases: string[];
  steps: { title: string; description: string }[];
  stepsHeading?: string;
  showcaseImages: [string, string];
  ctaText: string;
}

export interface ProcessStep {
  title: string;
  description: string;
}

export interface WhyUsItem {
  title: string;
  description: string;
  icon: string;
}
