"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FAQItem } from "@/types";

interface AccordionProps {
  items: readonly FAQItem[];
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            className="overflow-hidden rounded-2xl bg-white shadow-premium"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 p-6 text-left md:p-8"
              aria-expanded={isOpen}
            >
              <span className="font-heading text-lg font-semibold text-brand-black md:text-xl">
                {item.question}
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-accent">
                {isOpen ? (
                  <Minus className="h-4 w-4 text-brand-black" />
                ) : (
                  <Plus className="h-4 w-4 text-brand-black" />
                )}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="px-6 pb-6 text-brand-black/60 leading-relaxed md:px-8 md:pb-8">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
