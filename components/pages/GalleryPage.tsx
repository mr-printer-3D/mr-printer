"use client";

import { Portfolio } from "@/components/home/Portfolio";
import { motion } from "framer-motion";

export function GalleryPage() {
  return (
    <>
      <section className="relative flex min-h-[50vh] items-center justify-center bg-brand-bg px-6 pt-32 pb-12 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <span className="mb-4 block text-sm font-medium uppercase tracking-[0.2em] text-brand-gold">
            Gallery
          </span>
          <h1 className="font-heading text-5xl font-bold text-brand-black md:text-7xl">
            Our Creations
          </h1>
          <p className="mt-6 max-w-xl text-lg text-brand-black/60 mx-auto">
            A visual journey through our finest 3D printed works.
          </p>
        </motion.div>
      </section>

      <Portfolio />
    </>
  );
}
