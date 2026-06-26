"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { CTA } from "@/components/home/CTA";
import { BRAND, WHY_US, PROCESS_STEPS } from "@/lib/constants";
import { fadeUp, staggerContainer } from "@/lib/animations";

const STATS = [
  { value: "10K+", label: "Products Delivered" },
  { value: "500+", label: "Happy Clients" },
  { value: "50+", label: "Industries Served" },
  { value: "99%", label: "Satisfaction Rate" },
] as const;

export function AboutPage() {
  return (
    <>
      <section className="relative flex min-h-[60vh] items-center justify-center bg-brand-bg px-6 pt-32 pb-20 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <Image
            src="/images/logo.png"
            alt={BRAND.name}
            width={100}
            height={100}
            className="mx-auto mb-8 h-24 w-24 rounded-full object-cover"
          />
          <h1 className="font-heading text-5xl font-bold text-brand-black md:text-7xl">
            About {BRAND.name}
          </h1>
          <p className="mt-4 text-xl text-brand-gold font-medium">{BRAND.tagline}</p>
        </motion.div>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <SectionHeader
              label="Our Story"
              title="Redefining 3D Printing in India"
            />
            <div className="space-y-4 text-brand-black/70 leading-relaxed text-lg">
              <p>
                {BRAND.name} was born from a simple belief: 3D printing should be
                an art form, not just a manufacturing process. We set out to create
                a studio where every product — from a single keychain to a
                thousand-piece corporate order — receives the same level of
                craftsmanship and care.
              </p>
              <p>
                Today, we serve leading brands across jewellery, fashion,
                hospitality, real estate, and corporate sectors. Our commitment to
                premium finishes, sustainable materials, and rapid delivery has
                made us the go-to 3D printing studio for businesses that refuse
                to compromise on quality.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            {STATS.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp}>
                <Card hover={false} className="text-center">
                  <p className="font-heading text-3xl font-bold text-brand-gold md:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-brand-black/60">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      <Section className="bg-white">
        <SectionHeader
          label="Our Values"
          title="What Sets Us Apart"
          align="center"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_US.map((item) => (
            <Card key={item.title}>
              <h3 className="font-heading text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-brand-black/60 leading-relaxed">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader
          label="How We Work"
          title="Our Process"
          align="center"
        />
        <div className="flex flex-wrap justify-center gap-4">
          {PROCESS_STEPS.map((step, i) => (
            <div key={step.title} className="flex items-center gap-4">
              <div className="rounded-2xl bg-white px-6 py-4 shadow-premium text-center">
                <p className="font-heading font-bold text-brand-black">
                  {step.title}
                </p>
              </div>
              {i < PROCESS_STEPS.length - 1 && (
                <span className="hidden text-brand-gold text-2xl md:block">→</span>
              )}
            </div>
          ))}
        </div>
      </Section>

      <CTA />
    </>
  );
}
