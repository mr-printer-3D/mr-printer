"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextReveal } from "@/components/ui/TextReveal";

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-brand-black py-32 md:py-40">
      <div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gold/10 blur-3xl"
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
        <TextReveal
          text="Let's Build Something"
          className="font-heading text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
          delay={0}
        />
        <TextReveal
          text="Amazing Together."
          className="font-heading text-4xl font-bold tracking-tight text-brand-gold md:text-5xl lg:text-6xl"
          delay={0.2}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-8 text-lg text-white/50 md:text-xl"
        >
          Ready to bring your vision to life? Get in touch and let&apos;s create
          something extraordinary.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button href="/contact" variant="gold" size="lg" magnetic>
            Start Your Project
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            href="/products"
            variant="outline"
            size="lg"
            magnetic
            className="border-white/20 text-white hover:bg-white hover:text-brand-black"
          >
            View Products
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
