"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { PORTFOLIO_ITEMS, GALLERY_FILTERS } from "@/lib/constants";

export function Portfolio() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [lightboxItem, setLightboxItem] = useState<
    (typeof PORTFOLIO_ITEMS)[number] | null
  >(null);

  const filtered =
    activeFilter === "All"
      ? PORTFOLIO_ITEMS
      : PORTFOLIO_ITEMS.filter(
          (item) =>
            item.category === activeFilter.toLowerCase().replace(/ /g, "-"),
        );

  return (
    <Section id="portfolio" className="bg-white">
      <SectionHeader
        label="Portfolio"
        title="Our Work Speaks"
        description="A curated showcase of our finest 3D printed creations."
        align="center"
      />

      <div className="mb-12 flex flex-wrap justify-center gap-3">
        {GALLERY_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 ${
              activeFilter === filter
                ? "bg-brand-black text-white shadow-premium"
                : "bg-brand-bg text-brand-black/60 hover:text-brand-black"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="group relative cursor-pointer overflow-hidden rounded-3xl"
              onClick={() => setLightboxItem(item)}
            >
              <div
                className="relative flex aspect-[4/5] min-h-[320px] items-center justify-center overflow-hidden bg-brand-bg p-4"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </div>

              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-brand-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex w-full items-center justify-between p-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-white/60 capitalize">
                      {item.category.replace(/-/g, " ")}
                    </p>
                  </div>
                  <ZoomIn className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/80 backdrop-blur-xl p-6"
            onClick={() => setLightboxItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-3xl w-full rounded-3xl bg-white overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxItem(null)}
                className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm"
                aria-label="Close lightbox"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative flex aspect-[4/5] max-h-[70vh] w-full items-center justify-center bg-brand-bg p-4">
                <div className="relative h-full w-full">
                  <Image
                    src={lightboxItem.image}
                    alt={lightboxItem.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
              </div>

              <div className="p-8 text-center">
                <h3 className="font-heading text-2xl font-bold text-brand-black">
                  {lightboxItem.title}
                </h3>
                <p className="mt-2 text-brand-black/60 capitalize">
                  {lightboxItem.category.replace(/-/g, " ")}
                </p>
                {lightboxItem.slug && (
                  <Link
                    href={`/products/${lightboxItem.slug}`}
                    className="mt-6 inline-flex items-center gap-2 text-brand-gold font-medium hover:underline"
                  >
                    View Product
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}
