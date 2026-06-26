"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { CatalogProduct } from "@/types";

interface ProductCardProps {
  product: CatalogProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.4 }}>
      <Link
        href={`/products/${product.slug}`}
        className="group block overflow-hidden rounded-3xl bg-white shadow-premium transition-shadow duration-500 hover:shadow-premium-lg"
      >
        <div className="relative h-72 overflow-hidden bg-[#A8D8F0]">
          <Image
            src={product.heroImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            <ArrowUpRight className="h-5 w-5 text-brand-black" />
          </div>
          <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-black backdrop-blur-sm">
            {product.category.replace(/-/g, " ")}
          </span>
        </div>

        <div className="p-8">
          <h3 className="font-heading text-xl font-bold text-brand-black mb-2">
            {product.name}
          </h3>
          <p className="text-brand-gold text-sm font-medium mb-3">
            {product.tagline}
          </p>
          <p className="text-brand-black/60 text-sm leading-relaxed line-clamp-2">
            {product.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
