"use client";

import { motion } from "framer-motion";
import { Section, SectionHeader } from "@/components/ui/Section";
import { INDUSTRIES } from "@/lib/constants";
import { staggerFast, scaleIn } from "@/lib/animations";

export function Industries() {
  return (
    <Section id="industries">
      <SectionHeader
        label="Industries"
        title="Trusted Across Sectors"
        description="From luxury jewellery brands to corporate giants, we serve diverse industries with equal excellence."
        align="center"
      />

      <motion.div
        variants={staggerFast}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="flex flex-wrap justify-center gap-4"
      >
        {INDUSTRIES.map((industry) => (
          <motion.div
            key={industry}
            variants={scaleIn}
            whileHover={{ scale: 1.05, y: -2 }}
            className="rounded-full border border-brand-black/10 bg-white px-8 py-4 shadow-premium transition-shadow hover:shadow-premium-lg cursor-default"
          >
            <span className="font-heading text-sm font-semibold text-brand-black md:text-base">
              {industry}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
