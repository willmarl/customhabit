import { useEffect, useRef, useState } from "react";
import { sliceSpans, type WheelSlice } from "../wheel";

type RewardWheelProps = {
  slices: WheelSlice[];
  landIndex: number | null;
  spinToken: number;
  onRest?: () => void;
};

function point(cx: number, cy: number, radius: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

function slicePath(
  cx: number,
  cy: number,
  radius: number,
  start: number,
  end: number,
): string {
  const [x1, y1] = point(cx, cy, radius, start);
  const [x2, y2] = point(cx, cy, radius, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
}

function nextRotation(prev: number, center: number): number {
  const mod = ((prev % 360) + 360) % 360;
  const desired = (360 - center) % 360;
  let delta = desired - mod;
  if (delta < 0) delta += 360;
  return prev + delta + 360 * 6;
}

export default function RewardWheel({
  slices,
  landIndex,
  spinToken,
  onRest,
}: RewardWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [seenSpin, setSeenSpin] = useState(0);
  const settledFor = useRef(0);
  const onRestRef = useRef(onRest);

  useEffect(() => {
    onRestRef.current = onRest;
  }, [onRest]);

  if (spinToken !== seenSpin) {
    setSeenSpin(spinToken);
    if (spinToken !== 0 && landIndex != null) {
      const center = sliceSpans(slices.map((slice) => slice.weight))[landIndex]?.center;
      if (center != null) {
        setRotation((prev) => nextRotation(prev, center));
      }
    }
  }

  useEffect(() => {
    if (spinToken === 0) return;
    const fallback = window.setTimeout(() => {
      if (settledFor.current === spinToken) return;
      settledFor.current = spinToken;
      onRestRef.current?.();
    }, 4800);
    return () => window.clearTimeout(fallback);
  }, [spinToken]);

  const finish = () => {
    if (settledFor.current === spinToken) return;
    settledFor.current = spinToken;
    onRestRef.current?.();
  };

  const geometry = sliceSpans(slices.map((slice) => slice.weight));
  const cx = 160;
  const cy = 160;
  const radius = 148;

  return (
    <div className="relative mx-auto size-72">
      <div
        className="absolute inset-0"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: seenSpin === 0
            ? "none"
            : "transform 4.4s cubic-bezier(0.12, 0.65, 0.05, 1)",
        }}
        onTransitionEnd={(event) => {
          if (event.propertyName !== "transform") return;
          if (event.target !== event.currentTarget) return;
          finish();
        }}
      >
        <svg viewBox="0 0 320 320" className="size-full">
          {slices.map((slice, index) => {
            const geo = geometry[index];
            if (!geo) return null;
            const [lx, ly] = point(cx, cy, radius * 0.68, geo.center);
            const showLabel = geo.span >= 16;
            return (
              <g key={slice.id}>
                <path
                  d={slicePath(cx, cy, radius, geo.start, geo.start + geo.span)}
                  fill={slice.color}
                  stroke="rgba(0,0,0,0.25)"
                  strokeWidth="0.6"
                />
                {showLabel ? (
                  <text
                    x={lx}
                    y={ly}
                    fill="#fff"
                    fontSize={geo.span > 40 ? 16 : 11}
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${geo.center}, ${lx}, ${ly})`}
                  >
                    {slice.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-14 rounded-full border border-border bg-card shadow-sm" />
      </div>
      <div className="absolute top-1 left-1/2 z-10 -translate-x-1/2 border-x-8 border-t-[14px] border-x-transparent border-t-foreground" />
    </div>
  );
}
