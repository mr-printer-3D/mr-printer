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
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/4 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-brand-gold/10 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-brand-accent to-transparent blur-3xl"
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center px-6 pt-32 pb-20 md:px-12 lg:flex-row lg:items-center lg:gap-12 lg:px-20 lg:pt-0">
        {/* Text content */}
        <div className="flex-1 text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mb-6 text-sm font-medium uppercase tracking-[0.3em] text-brand-gold"
          >
            {BRAND.tagline}
          </motion.p>

          <TextReveal
            text="Create."
            className="font-heading text-6xl font-bold tracking-tight text-brand-black md:text-7xl lg:text-8xl"
            delay={1}
          />
          <TextReveal
            text="Print."
            className="font-heading text-6xl font-bold tracking-tight text-brand-gold md:text-7xl lg:text-8xl"
            delay={1.15}
          />
          <TextReveal
            text="Personalize."
            className="font-heading text-6xl font-bold tracking-tight text-brand-black md:text-7xl lg:text-8xl"
            delay={1.3}
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="mt-8 max-w-lg text-lg text-brand-black/60 leading-relaxed md:text-xl mx-auto lg:mx-0"
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

        {/* 3D Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 h-[400px] w-full flex-1 lg:mt-0 lg:h-[600px]"
        >
          <HeroCanvas />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
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
