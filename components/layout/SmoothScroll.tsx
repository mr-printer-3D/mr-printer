"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/** Pricing tool needs native scroll — Lenis fights the calculator page */
const NATIVE_SCROLL_PREFIXES = ["/tools/", "/listing-images", "/meesho"];

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname() || "/";

  useEffect(() => {
    const native = NATIVE_SCROLL_PREFIXES.some((p) => pathname.startsWith(p));
    if (native) {
      document.documentElement.classList.add("native-scroll");
      // Kill any leftover Lenis from a previous route
      document.documentElement.style.removeProperty("height");
      document.body.style.removeProperty("height");
      document.body.style.removeProperty("overflow");
      return () => document.documentElement.classList.remove("native-scroll");
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  return <>{children}</>;
}
