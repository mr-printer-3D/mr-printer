"use client";

import { motion } from "framer-motion";
import { Gift, Building2, Users, Award, Truck, Palette } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { CTA } from "@/components/home/CTA";
import { fadeUp, staggerContainer } from "@/lib/animations";

const CORPORATE_PACKAGES: Array<{
  title: string;
  description: string;
  quantity: string;
  features: readonly string[];
  icon: typeof Gift;
  featured?: boolean;
}> = [
  {
    title: "Starter Pack",
    description: "Perfect for small teams and events",
    quantity: "50–200 pieces",
    features: ["Custom branding", "2 design revisions", "Standard packaging"],
    icon: Gift,
  },
  {
    title: "Business Pack",
    description: "Ideal for corporate campaigns",
    quantity: "200–1,000 pieces",
    features: [
      "Premium branding",
      "Unlimited revisions",
      "Luxury packaging",
      "Express delivery",
    ],
    icon: Building2,
    featured: true,
  },
  {
    title: "Enterprise Pack",
    description: "For large-scale corporate needs",
    quantity: "1,000+ pieces",
    features: [
      "Full brand integration",
      "Dedicated account manager",
      "Custom packaging design",
      "Priority production",
      "Pan-India delivery",
    ],
    icon: Users,
  },
];

const BENEFITS = [
  { icon: Award, title: "Premium Quality", desc: "Flawless finish on every piece" },
  { icon: Palette, title: "Custom Design", desc: "Tailored to your brand identity" },
  { icon: Truck, title: "Fast Delivery", desc: "Express shipping nationwide" },
] as const;

export function CorporateGiftingPage() {
  return (
    <>
      <section className="relative flex min-h-[60vh] items-center justify-center bg-brand-black px-6 pt-32 pb-20 md:px-12">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-brand-gold/10 blur-3xl"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center"
        >
          <span className="mb-4 block text-sm font-medium uppercase tracking-[0.2em] text-brand-gold">
            Corporate Gifting
          </span>
          <h1 className="font-heading text-5xl font-bold text-white md:text-7xl">
            Gifts That <span className="text-brand-gold">Impress</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/50 mx-auto">
            Elevate your corporate gifting with premium 3D printed merchandise
            that reflects your brand&apos;s excellence.
          </p>
        </motion.div>
      </section>

      <Section>
        <SectionHeader
          label="Packages"
          title="Choose Your Package"
          description="Flexible corporate gifting packages designed for every scale and budget."
          align="center"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-8 md:grid-cols-3"
        >
          {CORPORATE_PACKAGES.map((pkg) => (
            <motion.div
              key={pkg.title}
              variants={fadeUp}
              className={`relative rounded-3xl p-8 ${
                pkg.featured
                  ? "bg-brand-black text-white shadow-premium-lg ring-2 ring-brand-gold"
                  : "bg-white shadow-premium"
              }`}
            >
              {pkg.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gold px-4 py-1 text-xs font-bold text-brand-black">
                  Most Popular
                </span>
              )}
              <pkg.icon
                className={`h-8 w-8 mb-6 ${pkg.featured ? "text-brand-gold" : "text-brand-gold"}`}
              />
              <h3 className="font-heading text-2xl font-bold mb-2">{pkg.title}</h3>
              <p
                className={`text-sm mb-4 ${pkg.featured ? "text-white/60" : "text-brand-black/60"}`}
              >
                {pkg.description}
              </p>
              <p className="font-heading text-lg font-bold text-brand-gold mb-6">
                {pkg.quantity}
              </p>
              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-2 text-sm ${
                      pkg.featured ? "text-white/70" : "text-brand-black/70"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-gold shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                href="/contact"
                variant={pkg.featured ? "gold" : "primary"}
                className="w-full"
                magnetic
              >
                Get Started
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section className="bg-white">
        <div className="grid gap-8 md:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/10">
                <benefit.icon className="h-6 w-6 text-brand-gold" />
              </div>
              <h3 className="font-heading text-lg font-bold">{benefit.title}</h3>
              <p className="mt-2 text-sm text-brand-black/60">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <CTA />
    </>
  );
}
