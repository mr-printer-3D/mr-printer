"use client";

import { motion } from "framer-motion";
import { Section, SectionHeader } from "@/components/ui/Section";
import { ProductCard } from "@/components/products/ProductCard";
import { CATALOG } from "@/lib/products";
import { staggerContainer, fadeUp } from "@/lib/animations";

export function FeaturedProducts() {
  return (
    <Section id="products" className="bg-white">
      <SectionHeader
        label="Our Catalog"
        title="Featured Products"
        description="Handcrafted 3D printed creations designed to bring joy to everyday moments."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        {CATALOG.map((product) => (
          <motion.div key={product.slug} variants={fadeUp}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
