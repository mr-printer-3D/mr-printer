"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { TextReveal } from "@/components/ui/TextReveal";
import { Button } from "@/components/ui/Button";
import { HeroCanvas } from "@/components/three/HeroCanvas";
import { BRAND } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-brand-bg">
      {/* Background gradients — behind everything */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/4 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-brand-gold/10 to-transparent blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-brand-accent to-transparent blur-3xl"
        />
      </div>

      {/* Two-column grid — text and product never share the same space */}
      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-28 pt-28 md:px-12 lg:grid-cols-2 lg:gap-16 lg:px-20 lg:pb-20 lg:pt-24">
        {/* Left: copy */}
        <div className="relative z-10 w-full max-w-xl justify-self-center lg:justify-self-start">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mb-6 text-center text-sm font-medium uppercase tracking-[0.3em] text-brand-gold lg:text-left"
          >
            {BRAND.tagline}
          </motion.p>

          <div className="space-y-1 text-center lg:text-left">
            <TextReveal
              text="Create."
              as="span"
              className="block font-heading text-5xl font-bold leading-none tracking-tight text-brand-black sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl"
              delay={1}
            />
            <TextReveal
              text="Print."
              as="span"
              className="block font-heading text-5xl font-bold leading-none tracking-tight text-brand-gold sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl"
              delay={1.15}
            />
            <TextReveal
              text="Personalize."
              as="span"
              className="block font-heading text-5xl font-bold leading-none tracking-tight text-brand-black sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl"
              delay={1.3}
            />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="mx-auto mt-8 max-w-lg text-center text-lg leading-relaxed text-brand-black/60 md:text-xl lg:mx-0 lg:text-left"
          >
            Premium 3D printing studio crafting world-class custom products,
            corporate gifts, and personalized creations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3, duration: 0.8 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
          >
            <Button href="/products" variant="primary" size="lg" magnetic>
              Explore Products
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/contact" variant="outline" size="lg" magnetic>
              Get Custom Quote
            </Button>
          </motion.div>
        </div>

        {/* Right: original 3D scene — floating on background, no box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-0 h-[400px] w-full min-w-0 sm:h-[480px] lg:h-[600px] lg:justify-self-end"
        >
          <HeroCanvas />
        </motion.div>
      </div>

      {/* Scroll hint — below content, won't overlap buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="pointer-events-none absolute bottom-6 left-1/2 z-0 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest text-brand-black/40">
            Scroll
          </span>
          <div className="h-8 w-px bg-brand-black/20" />
        </motion.div>
      </motion.div>
    </section>
  );
}
