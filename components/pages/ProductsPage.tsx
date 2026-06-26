"use client";

import { motion } from "framer-motion";
import { Section, SectionHeader } from "@/components/ui/Section";
import { ProductCard } from "@/components/products/ProductCard";
import { CATALOG } from "@/lib/products";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { staggerContainer, fadeUp } from "@/lib/animations";

export function ProductsPage() {
  return (
    <>
      <section className="relative flex min-h-[60vh] items-center justify-center bg-brand-black px-6 pt-32 pb-20 md:px-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gold/10 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-center"
        >
          <span className="mb-4 block text-sm font-medium uppercase tracking-[0.2em] text-brand-gold">
            Our Catalog
          </span>
          <h1 className="font-heading text-5xl font-bold text-white md:text-7xl">
            Premium Products
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/50 mx-auto">
            Explore our handcrafted 3D printed creations — designed with love,
            printed with precision.
          </p>
        </motion.div>
      </section>

      {/* Catalog */}
      <Section>
        <SectionHeader
          label="Catalog"
          title="Featured Products"
          description="Our current collection of premium 3D printed products."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {CATALOG.map((product) => (
            <motion.div key={product.slug} variants={fadeUp}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Categories */}
      <Section className="bg-white">
        <SectionHeader
          label="Collections"
          title="Browse by Category"
          description="We also create custom products across these categories."
          align="center"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_CATEGORIES.map((category) => (
            <div
              key={category.id}
              id={category.id}
              className={`rounded-3xl bg-gradient-to-br ${category.gradient} p-8 shadow-premium`}
            >
              <h3 className="font-heading text-xl font-bold text-brand-black mb-2">
                {category.title}
              </h3>
              <p className="text-brand-black/60 text-sm leading-relaxed">
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
