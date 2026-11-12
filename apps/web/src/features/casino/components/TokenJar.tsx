import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useRef } from "react";
import { DoubleSide, type Mesh } from "three";
import { tokenColor } from "../colors";
import type { CasinoSettings, CasinoToken } from "../types";

const BOTTOM = -1.35;
const HEIGHT = 2.7;
const JAR_RADIUS = 1.32;
const TOKEN_RADIUS = 0.1;
const GAP = 0.24;

function lineY(count: number, moon: number): number {
  const fraction = Math.min(1, count / Math.max(moon, 1));
  return BOTTOM + fraction * HEIGHT;
}

function tokenSlots(count: number): [number, number, number][] {
  const slots: [number, number, number][] = [];
  let y = BOTTOM + TOKEN_RADIUS + 0.06;
  const limit = JAR_RADIUS - 0.28 - TOKEN_RADIUS;
  while (slots.length < count) {
    const row: [number, number][] = [];
    for (let x = -limit; x <= limit + 0.001; x += GAP) {
      for (let z = -limit; z <= limit + 0.001; z += GAP) {
        if (x * x + z * z <= limit * limit) row.push([x, z]);
      }
    }
    row.sort((a, b) => a[0] ** 2 + a[1] ** 2 - (b[0] ** 2 + b[1] ** 2));
    for (const [x, z] of row) {
      if (slots.length >= count) break;
      slots.push([x, y, z]);
    }
    y += GAP;
    if (y > 6) break;
  }
  return slots;
}

function TokenSphere({
  position,
  color,
  drop,
}: {
  position: [number, number, number];
  color: string;
  drop: boolean;
}) {
  const ref = useRef<Mesh>(null);
  const gold = color === "#f6c945";

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.position.set(
      position[0],
      drop ? position[1] + 2.8 : position[1],
      position[2],
    );
  }, [drop, position]);

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const [x, y, z] = position;
    mesh.position.x = x;
    mesh.position.z = z;
    const next = mesh.position.y + (y - mesh.position.y) * Math.min(1, delta * 3.2);
    mesh.position.y = Math.abs(next - y) < 0.001 ? y : next;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[TOKEN_RADIUS, 20, 16]} />
      <meshStandardMaterial
        color={color}
        metalness={gold ? 0.85 : 0.18}
        roughness={gold ? 0.22 : 0.45}
        emissive={gold ? "#8a6a10" : "#000000"}
        emissiveIntensity={gold ? 0.35 : 0}
      />
    </mesh>
  );
}

function PrizeRing({
  y,
  color,
}: {
  y: number;
  color: string;
}) {
  return (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[JAR_RADIUS + 0.02, 0.015, 8, 48]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
    </mesh>
  );
}

function JarScene({
  tokens,
  dropId,
  settings,
}: {
  tokens: CasinoToken[];
  dropId: number | null;
  settings: CasinoSettings;
}) {
  const ordered = [...tokens].sort((a, b) => a.id - b.id);
  const slots = tokenSlots(Math.max(ordered.length, 1));

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 5, 2]} intensity={1.3} />
      <pointLight position={[-2, 1.5, 3]} intensity={0.45} />
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[JAR_RADIUS, JAR_RADIUS * 0.92, HEIGHT, 48, 1, true]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.16}
          roughness={0.04}
          metalness={0.05}
          color="#dbeafe"
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, BOTTOM, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[JAR_RADIUS * 0.92, 48]} />
        <meshStandardMaterial color="#e7e5e4" roughness={0.4} metalness={0.05} />
      </mesh>
      <mesh position={[0, BOTTOM + HEIGHT / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[JAR_RADIUS, 0.035, 10, 48]} />
        <meshStandardMaterial color="#f5f5f4" metalness={0.4} roughness={0.25} />
      </mesh>
      <PrizeRing y={lineY(settings.prize_mini_tokens, settings.prize_moon_tokens)} color="#22c55e" />
      <PrizeRing y={lineY(settings.prize_mid_tokens, settings.prize_moon_tokens)} color="#38bdf8" />
      <PrizeRing y={lineY(settings.prize_moon_tokens, settings.prize_moon_tokens)} color="#f6c945" />
      {ordered.map((token, index) => {
        const slot = slots[index] ?? slots[slots.length - 1] ?? [0, BOTTOM, 0];
        return (
          <TokenSphere
            key={token.id}
            position={slot}
            color={tokenColor(token.color)}
            drop={token.id === dropId}
          />
        );
      })}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.7}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.7}
      />
    </>
  );
}

type TokenJarProps = {
  tokens: CasinoToken[];
  dropId: number | null;
  settings: CasinoSettings;
};

export default function TokenJar({ tokens, dropId, settings }: TokenJarProps) {
  const lines = [
    { label: settings.prize_mini_name || "Mini", count: settings.prize_mini_tokens, color: "bg-green-500" },
    { label: settings.prize_mid_name || "Mid", count: settings.prize_mid_tokens, color: "bg-sky-400" },
    { label: settings.prize_moon_name || "Moonshot", count: settings.prize_moon_tokens, color: "bg-amber-400" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-gradient-to-b from-amber-50 to-background dark:from-zinc-900">
      <div className="h-[420px]">
        <Canvas
          camera={{ position: [0, 0.35, 4.5], fov: 38 }}
          gl={{ alpha: true, antialias: true }}
        >
          <Suspense fallback={null}>
            <JarScene tokens={tokens} dropId={dropId} settings={settings} />
          </Suspense>
        </Canvas>
      </div>
      <div className="space-y-2 border-t border-border/70 px-4 py-3">
        <p className="text-sm font-medium">
          {tokens.length} token{tokens.length === 1 ? "" : "s"} in the jar
        </p>
        <ul className="space-y-1.5">
          {lines.map((line) => {
            const reached = tokens.length >= line.count;
            return (
              <li key={line.count} className="flex items-center gap-2 text-xs">
                <span className={`size-2 rounded-full ${line.color}`} />
                <span className={reached ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {line.label}
                </span>
                <span className="ml-auto tabular-nums text-muted-foreground">
                  {Math.min(tokens.length, line.count)}/{line.count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
