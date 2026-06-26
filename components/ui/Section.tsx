"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
}

export function Section({ children, className, id, dark = false }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative w-full px-6 py-24 md:px-12 md:py-32 lg:px-20 lg:py-40",
        dark ? "bg-brand-black text-white" : "bg-brand-bg text-brand-black",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
}

export function SectionHeader({
  label,
  title,
  description,
  align = "left",
  light = false,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mb-16 md:mb-20",
        align === "center" && "text-center mx-auto max-w-3xl",
      )}
    >
      {label && (
        <span
          className={cn(
            "mb-4 block text-sm font-medium uppercase tracking-[0.2em]",
            light ? "text-brand-gold" : "text-brand-gold",
          )}
        >
          {label}
        </span>
      )}
      <h2
        className={cn(
          "font-heading text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl",
          light ? "text-white" : "text-brand-black",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-6 text-lg leading-relaxed md:text-xl",
            light ? "text-white/60" : "text-brand-black/60",
          )}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
}
