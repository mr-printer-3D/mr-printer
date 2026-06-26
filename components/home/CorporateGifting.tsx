"use client";

import { motion } from "framer-motion";
import { Gift, ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { fadeUp } from "@/lib/animations";

const CORPORATE_FEATURES = [
  "Custom branded merchandise",
  "Bulk order discounts",
  "Premium packaging",
  "Express delivery",
  "Design consultation",
  "Quality guarantee",
] as const;

export function CorporateGiftingSection() {
  return (
    <Section id="corporate" dark className="overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-brand-gold/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-brand-gold/5 blur-3xl" />
      </div>

      <div className="relative grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeader
            label="Corporate Gifting"
            title="Elevate Your Brand"
            description="Luxury corporate gifting solutions that leave lasting impressions on clients, partners, and employees."
            light
          />

          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="mb-10 space-y-4"
          >
            {CORPORATE_FEATURES.map((feature) => (
              <motion.li
                key={feature}
                variants={fadeUp}
                className="flex items-center gap-3 text-white/70"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gold/20">
                  <Gift className="h-3 w-3 text-brand-gold" />
                </div>
                {feature}
              </motion.li>
            ))}
          </motion.ul>

          <Button href="/corporate-gifting" variant="gold" size="lg" magnetic>
            Explore Corporate Gifting
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Premium mockup grid */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 gap-4"
        >
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ duration: 0.4 }}
              className={`rounded-3xl p-6 ${
                i % 2 === 0
                  ? "bg-brand-gold/10 border border-brand-gold/20"
                  : "bg-white/5 border border-white/10"
              } ${i === 1 ? "col-span-2" : ""}`}
            >
              <div
                className={`rounded-2xl ${
                  i === 1 ? "h-40" : "h-32"
                } bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center`}
              >
                <Gift
                  className={`text-brand-gold ${i === 1 ? "h-16 w-16" : "h-10 w-10"}`}
                />
              </div>
              <p className="mt-4 font-heading text-sm font-semibold text-white/80">
                {i === 1
                  ? "Executive Gift Collection"
                  : i === 2
                    ? "Branded Keychains"
                    : i === 3
                      ? "Desk Accessories"
                      : "Event Favors"}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
