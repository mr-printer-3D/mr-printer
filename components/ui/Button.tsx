"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMagneticEffect } from "@/hooks/useMagneticEffect";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "gold";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  magnetic?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  external?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-black text-white hover:bg-brand-black/90 shadow-premium",
  secondary:
    "bg-brand-accent text-brand-black hover:bg-brand-accent/80",
  outline:
    "border border-brand-black/20 text-brand-black hover:bg-brand-black hover:text-white",
  ghost:
    "text-brand-black hover:bg-brand-black/5",
  gold:
    "bg-brand-gold text-brand-black hover:bg-brand-gold/90 shadow-gold",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-5 py-2.5 text-sm",
  md: "px-7 py-3.5 text-base",
  lg: "px-9 py-4.5 text-lg",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className,
  magnetic = false,
  onClick,
  type = "button",
  external = false,
}: ButtonProps) {
  const { ref, handleMouseMove, handleMouseLeave } = useMagneticEffect({
    strength: 0.25,
  });

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300",
    variants[variant],
    sizes[size],
    className,
  );

  const motionProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 },
  };

  if (href) {
    const linkProps = external
      ? { target: "_blank" as const, rel: "noopener noreferrer" }
      : {};

    return (
      <motion.div
        ref={magnetic ? ref : undefined}
        onMouseMove={magnetic ? handleMouseMove : undefined}
        onMouseLeave={magnetic ? handleMouseLeave : undefined}
        className="inline-block"
        style={{ transition: "transform 0.3s ease" }}
      >
        <motion.div {...motionProps}>
          <Link href={href} className={classes} {...linkProps}>
            {children}
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={magnetic ? ref : undefined}
      onMouseMove={magnetic ? handleMouseMove : undefined}
      onMouseLeave={magnetic ? handleMouseLeave : undefined}
      className="inline-block"
      style={{ transition: "transform 0.3s ease" }}
    >
      <motion.button
        type={type}
        onClick={onClick}
        className={classes}
        {...motionProps}
      >
        {children}
      </motion.button>
    </motion.div>
  );
}
