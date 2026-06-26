"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Flag,
  Zap,
  Palette,
  Package,
  Leaf,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { WHY_US } from "@/lib/constants";
import { staggerContainer, fadeUp } from "@/lib/animations";

const iconMap = {
  sparkles: Sparkles,
  flag: Flag,
  zap: Zap,
  palette: Palette,
  package: Package,
  leaf: Leaf,
} as const;

export function WhyMrPrinter() {
  return (
    <Section id="why-us">
      <SectionHeader
        label="Why Choose Us"
        title="Crafted With Precision"
        description="We don't just print — we create experiences. Every product reflects our commitment to excellence."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {WHY_US.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          return (
            <motion.div key={item.title} variants={fadeUp}>
              <Card className="h-full">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/10">
                  <Icon className="h-6 w-6 text-brand-gold" />
                </div>
                <h3 className="font-heading text-xl font-bold text-brand-black mb-3">
                  {item.title}
                </h3>
                <p className="text-brand-black/60 leading-relaxed">
                  {item.description}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </Section>
  );
}
