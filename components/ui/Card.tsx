"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export function Card({ children, className, hover = true, glass = false }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -6, scale: 1.01 } : undefined}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-3xl p-8 transition-shadow duration-500",
        glass
          ? "glass border border-white/20"
          : "bg-white shadow-premium hover:shadow-premium-lg",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
