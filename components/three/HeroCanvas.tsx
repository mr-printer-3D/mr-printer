"use client";

import dynamic from "next/dynamic";
import { useMousePosition } from "@/hooks/useMousePosition";

const HeroScene = dynamic(
  () => import("@/components/three/HeroScene").then((m) => m.HeroScene),
  { ssr: false, loading: () => <div className="h-full w-full" /> },
);

export function HeroCanvas() {
  const { x, y } = useMousePosition();
  const normalizedX = typeof window !== "undefined" ? (x / window.innerWidth) * 2 - 1 : 0;
  const normalizedY = typeof window !== "undefined" ? -(y / window.innerHeight) * 2 + 1 : 0;

  return (
    <div className="h-full w-full">
      <HeroScene mouse={{ x: normalizedX, y: normalizedY }} />
    </div>
  );
}
