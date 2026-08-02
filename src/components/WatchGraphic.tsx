import { useId } from "react";
import type { CaseColor, StrapType } from "../data/types";

const CASE_GRADIENTS: Record<CaseColor, [string, string, string]> = {
  silver: ["#f4f5f7", "#c7ccd1", "#9aa0a6"],
  gold: ["#f6e2a8", "#c9a24b", "#8c6d24"],
  rosegold: ["#f3d3c4", "#d9a68c", "#a9715a"],
  black: ["#4a4a4a", "#2a2a2a", "#0d0d0d"],
};

interface WatchGraphicProps {
  caseColor: CaseColor;
  dialColor: string;
  strapType: StrapType;
  strapColor: string;
  className?: string;
}

export function WatchGraphic({
  caseColor,
  dialColor,
  strapType,
  strapColor,
  className,
}: WatchGraphicProps) {
  const uid = useId();
  const [c1, c2, c3] = CASE_GRADIENTS[caseColor];
  const isDarkDial = isDark(dialColor);
  const markerColor = isDarkDial ? "#ffffff" : "#1a1a1a";

  return (
    <svg
      viewBox="0 0 300 400"
      className={className}
      role="img"
      aria-label="Watch illustration"
    >
      <defs>
        <linearGradient id={`case-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="55%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
        <radialGradient id={`dial-${uid}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={lighten(dialColor, 0.18)} />
          <stop offset="100%" stopColor={dialColor} />
        </radialGradient>
      </defs>

      {/* Strap - top */}
      <StrapSegment
        type={strapType}
        color={strapColor}
        x={110}
        y={0}
        width={80}
        height={104}
        flip={false}
      />
      {/* Strap - bottom */}
      <StrapSegment
        type={strapType}
        color={strapColor}
        x={110}
        y={296}
        width={80}
        height={104}
        flip
      />

      {/* Lugs */}
      <path
        d="M118 108 L108 92 L128 82 L138 100 Z"
        fill={`url(#case-${uid})`}
      />
      <path
        d="M182 108 L192 92 L172 82 L162 100 Z"
        fill={`url(#case-${uid})`}
      />
      <path
        d="M118 292 L108 308 L128 318 L138 300 Z"
        fill={`url(#case-${uid})`}
      />
      <path
        d="M182 292 L192 308 L172 318 L162 300 Z"
        fill={`url(#case-${uid})`}
      />

      {/* Crown */}
      <rect x="268" y="188" width="20" height="24" rx="3" fill={`url(#case-${uid})`} />

      {/* Case */}
      <circle cx="150" cy="200" r="112" fill={`url(#case-${uid})`} />
      <circle cx="150" cy="200" r="96" fill={`url(#dial-${uid})`} />

      {/* Hour markers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const rOuter = 84;
        const rInner = i % 3 === 0 ? 70 : 76;
        const x1 = 150 + Math.cos(angle) * rOuter;
        const y1 = 200 + Math.sin(angle) * rOuter;
        const x2 = 150 + Math.cos(angle) * rInner;
        const y2 = 200 + Math.sin(angle) * rInner;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={markerColor}
            strokeWidth={i % 3 === 0 ? 3 : 1.5}
            strokeLinecap="round"
            opacity={0.85}
          />
        );
      })}

      {/* Hands */}
      <line x1="150" y1="200" x2="150" y2="145" stroke={markerColor} strokeWidth="4" strokeLinecap="round" />
      <line x1="150" y1="200" x2="188" y2="200" stroke={markerColor} strokeWidth="3" strokeLinecap="round" />
      <circle cx="150" cy="200" r="5" fill={markerColor} />
    </svg>
  );
}

function StrapSegment({
  type,
  color,
  x,
  y,
  width,
  height,
  flip,
}: {
  type: StrapType;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  flip: boolean;
}) {
  if (type === "metal") {
    const links = 6;
    const linkH = height / links;
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={color} />
        {Array.from({ length: links }).map((_, i) => (
          <rect
            key={i}
            x={x}
            y={y + i * linkH}
            width={width}
            height={linkH - 3}
            fill={i % 2 === 0 ? lighten(color, 0.12) : darken(color, 0.08)}
          />
        ))}
      </g>
    );
  }

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={14} fill={color} />
      <line
        x1={x + width / 2}
        y1={flip ? y + 10 : y}
        x2={x + width / 2}
        y2={flip ? y + height : y + height - 10}
        stroke={darken(color, 0.2)}
        strokeWidth={1}
        opacity={0.5}
      />
    </g>
  );
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function isDark(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
