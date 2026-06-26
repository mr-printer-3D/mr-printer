"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-brand-bg/80 backdrop-blur-xl shadow-sm border-b border-brand-black/5"
            : "bg-transparent",
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12 lg:px-20">
          <Link href="/" className="relative z-10 flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt={BRAND.name}
              width={48}
              height={48}
              className="h-10 w-10 rounded-full object-cover md:h-12 md:w-12"
              priority
            />
            <span className="font-heading text-lg font-bold tracking-tight text-brand-black hidden sm:block">
              {BRAND.name}
            </span>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  pathname === link.href
                    ? "text-brand-gold"
                    : "text-brand-black/70 hover:text-brand-black",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:block">
            <Button href="/contact" variant="primary" size="sm" magnetic>
              Get Quote
            </Button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-brand-black/5 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-brand-black" />
            ) : (
              <Menu className="h-5 w-5 text-brand-black" />
            )}
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-brand-bg/95 backdrop-blur-xl lg:hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex h-full flex-col items-center justify-center gap-8"
            >
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "font-heading text-3xl font-bold",
                      pathname === link.href
                        ? "text-brand-gold"
                        : "text-brand-black",
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Button href="/contact" variant="gold" size="lg" magnetic>
                Get Quote
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
