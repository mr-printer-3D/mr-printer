"use client";

import { motion } from "framer-motion";
import { Section, SectionHeader } from "@/components/ui/Section";
import { PROCESS_STEPS } from "@/lib/constants";

export function Process() {
  return (
    <Section id="process">
      <SectionHeader
        label="Our Process"
        title="From Idea to Reality"
        description="A seamless journey from your initial concept to a beautifully finished product at your doorstep."
        align="center"
      />

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-brand-black/10 lg:block" />

        <div className="space-y-12 lg:space-y-0">
          {PROCESS_STEPS.map((step, index) => {
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`relative flex items-center gap-8 lg:gap-0 ${
                  isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
              >
                <div
                  className={`flex-1 ${isEven ? "lg:text-right lg:pr-16" : "lg:text-left lg:pl-16"}`}
                >
                  <span className="text-sm font-medium text-brand-gold">
                    Step {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-heading text-2xl font-bold text-brand-black md:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-brand-black/60">{step.description}</p>
                </div>

                {/* Center dot */}
                <div className="relative z-10 hidden lg:flex">
                  <motion.div
                    whileInView={{ scale: [0, 1.2, 1] }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold shadow-gold"
                  >
                    <span className="font-heading text-sm font-bold text-brand-black">
                      {index + 1}
                    </span>
                  </motion.div>
                </div>

                <div className="hidden flex-1 lg:block" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
