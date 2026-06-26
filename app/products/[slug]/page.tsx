import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/products/ProductDetail";
import { getProductBySlug, CATALOG } from "@/lib/products";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CATALOG.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.tagline,
      images: [{ url: product.heroImage, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
