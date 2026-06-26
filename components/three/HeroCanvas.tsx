"use client";

import {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useMousePosition } from "@/hooks/useMousePosition";
import { HeroSceneFallback } from "@/components/home/HeroSceneFallback";

class SceneErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

export function HeroCanvas() {
  const [ready, setReady] = useState(false);
  const [use3D, setUse3D] = useState(true);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [HeroScene, setHeroScene] = useState<
    typeof import("@/components/three/HeroScene").HeroScene | null
  >(null);
  const { x, y } = useMousePosition();

  const handleSceneError = useCallback(() => setSceneFailed(true), []);

  useEffect(() => {
    setUse3D(hasWebGL());
    setReady(true);

    import("@/components/three/HeroScene")
      .then((mod) => setHeroScene(() => mod.HeroScene))
      .catch(() => setSceneFailed(true));
  }, []);

  useEffect(() => {
    if (!ready || !use3D || sceneFailed || !HeroScene) return;

    const timer = window.setTimeout(() => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        "[data-hero-canvas] canvas",
      );
      if (!canvas || canvas.clientWidth === 0) {
        setSceneFailed(true);
      }
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [ready, use3D, sceneFailed, HeroScene]);

  const normalizedX =
    typeof window !== "undefined" ? (x / window.innerWidth) * 2 - 1 : 0;
  const normalizedY =
    typeof window !== "undefined" ? -(y / window.innerHeight) * 2 + 1 : 0;

  const show3D = ready && use3D && !sceneFailed && HeroScene;

  return (
    <div className="relative h-full min-h-[400px] w-full">
      {/* Always visible — ensures hero never looks empty */}
      <div className="absolute inset-0 z-0">
        <HeroSceneFallback />
      </div>

      {show3D && (
        <div className="absolute inset-0 z-10" data-hero-canvas>
          <SceneErrorBoundary onError={handleSceneError}>
            <HeroScene
              mouse={{ x: normalizedX, y: normalizedY }}
              onError={handleSceneError}
            />
          </SceneErrorBoundary>
        </div>
      )}
    </div>
  );
}
