"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { blurReveal } from "@/lib/animations";

interface BlurRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function BlurReveal({ children, className, delay = 0 }: BlurRevealProps) {
  return (
    <motion.div
      variants={blurReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
