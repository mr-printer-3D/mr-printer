"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function FloatingKeychain() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      groupRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={1.5}>
        <mesh position={[0, 1.2, 0]}>
          <torusGeometry args={[0.35, 0.06, 16, 32]} />
          <meshStandardMaterial color="#D8A531" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 16]} />
          <meshStandardMaterial color="#D8A531" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.4, 1.8, 0.15]} />
          <meshStandardMaterial color="#121212" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.3, 0.08]}>
          <boxGeometry args={[1.2, 0.15, 0.02]} />
          <meshStandardMaterial color="#D8A531" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.3, 0.08]}>
          <boxGeometry args={[0.8, 0.4, 0.02]} />
          <meshStandardMaterial color="#D8A531" metalness={0.7} roughness={0.2} />
        </mesh>
      </Float>
    </group>
  );
}

function FloatingNamePlate() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.25;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1}>
      <mesh ref={meshRef}>
        <boxGeometry args={[2.5, 0.8, 0.12]} />
        <meshStandardMaterial color="#121212" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[2, 0.15, 0.01]} />
        <meshStandardMaterial color="#D8A531" metalness={0.9} roughness={0.1} />
      </mesh>
    </Float>
  );
}

function NozzleWithFilament() {
  const filamentRef = useRef<THREE.Group>(null);
  const layers = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

  useFrame((state) => {
    if (filamentRef.current) {
      filamentRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group position={[2, 0, 0]}>
      <Float speed={1} floatIntensity={0.5}>
        <mesh position={[0, 1.5, 0]}>
          <coneGeometry args={[0.2, 0.5, 16]} />
          <meshStandardMaterial color="#121212" metalness={0.6} roughness={0.3} />
        </mesh>
        <group ref={filamentRef} position={[0, 0, 0]}>
          {layers.map((i) => (
            <mesh key={i} position={[0, i * 0.12 - 0.4, 0]}>
              <boxGeometry args={[0.8 - i * 0.05, 0.08, 0.8 - i * 0.05]} />
              <meshStandardMaterial
                color="#D8A531"
                metalness={0.5}
                roughness={0.3}
                transparent
                opacity={0.3 + (i / layers.length) * 0.7}
              />
            </mesh>
          ))}
        </group>
      </Float>
    </group>
  );
}

function Scene({ mouse }: { mouse: { x: number; y: number } }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.x = mouse.x * 5;
      lightRef.current.position.y = mouse.y * 5 + 2;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight ref={lightRef} position={[2, 3, 4]} intensity={1.5} color="#D8A531" />
      <pointLight position={[-3, 2, -2]} intensity={0.8} color="#FFFFFF" />
      <spotLight
        position={[0, 5, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#F8F7F4"
      />

      <FloatingKeychain />
      <group position={[-2.5, -0.5, -1]} scale={0.7}>
        <FloatingNamePlate />
      </group>
      <NozzleWithFilament />
    </>
  );
}

interface HeroSceneProps {
  mouse: { x: number; y: number };
  onReady?: () => void;
  onError?: () => void;
}

export function HeroScene({ mouse, onReady, onError }: HeroSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onReady?.();
      }}
      onError={(error) => {
        console.error("Hero 3D scene error:", error);
        onError?.();
      }}
    >
      <Scene mouse={mouse} />
    </Canvas>
  );
}
