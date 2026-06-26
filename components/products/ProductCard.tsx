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
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link
        href={`/products/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-premium transition-shadow duration-500 hover:shadow-premium-lg"
      >
        {/* Full-bleed image — no padding, no gaps */}
        <div className="relative h-[480px] w-full shrink-0 overflow-hidden">
          <Image
            src={product.heroImage}
            alt={product.name}
            fill
            className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            <ArrowUpRight className="h-5 w-5 text-brand-black" />
          </div>

          <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-black shadow-sm backdrop-blur-sm">
            {product.category.replace(/-/g, " ")}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-6 md:p-7">
          <h3 className="mb-2 min-h-[3.25rem] font-heading text-xl font-bold leading-snug text-brand-black line-clamp-2">
            {product.name}
          </h3>

          <p className="mb-4 min-h-[1.25rem] text-sm font-medium text-brand-gold line-clamp-1">
            {product.tagline}
          </p>

          <p className="mt-auto min-h-[4rem] text-sm leading-relaxed text-brand-black/60 line-clamp-3">
            {product.cardDescription}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
