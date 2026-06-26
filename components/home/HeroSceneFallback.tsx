"use client";

import { motion } from "framer-motion";
import { useMousePosition } from "@/hooks/useMousePosition";

/** CSS fallback — matches original 3D hero when WebGL unavailable */
export function HeroSceneFallback() {
  const { x, y } = useMousePosition();
  const tiltX = typeof window !== "undefined" ? (y / window.innerHeight - 0.5) * 10 : 0;
  const tiltY = typeof window !== "undefined" ? (x / window.innerWidth - 0.5) * -14 : 0;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 900 }}
        className="relative h-[320px] w-[280px] sm:h-[380px] sm:w-[320px]"
      >
        {/* Name plate — back left */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-40">
          <div className="h-4 w-28 rounded-sm bg-brand-black shadow-lg" />
          <div className="mx-auto mt-1 h-1 w-20 rounded-full bg-brand-gold" />
        </div>

        {/* Gold cylinder — left */}
        <div className="absolute left-6 top-[42%] h-2 w-10 rounded-full bg-gradient-to-r from-brand-gold to-[#b8922a] shadow-md" />

        {/* Keychain — center */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <div className="mx-auto mb-1 h-12 w-12 rounded-full border-[4px] border-brand-gold shadow-[0_0_20px_rgba(216,165,49,0.35)]" />
          <div className="mx-auto mb-2 h-5 w-1 rounded-full bg-brand-gold" />
          <div className="h-44 w-24 rounded-lg bg-brand-black shadow-[0_20px_50px_rgba(18,18,18,0.3)] sm:h-52 sm:w-28">
            <div className="mx-auto mt-8 h-2 w-20 rounded-full bg-brand-gold" />
            <div className="mx-auto mt-6 h-8 w-14 rounded bg-brand-gold/90" />
          </div>
        </div>

        {/* Nozzle + gold layers — right */}
        <div className="absolute right-0 top-[18%]">
          <div className="mx-auto mb-2 h-0 w-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-brand-black" />
          <div className="flex flex-col items-center gap-1">
            {[1, 0.88, 0.76, 0.64, 0.52, 0.4].map((w, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.5, delay: i * 0.15, repeat: Infinity }}
                className="h-2 rounded-sm bg-brand-gold"
                style={{ width: 56 * w }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
