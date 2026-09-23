/**
 * SHAPE72 hero wordmark — custom vector lettering.
 *
 * Monoline geometric letterforms drawn on a shared 5-unit cap-height grid,
 * uniform stroke, rounded caps and joins where the geometry allows.
 * Rendered as inline SVG so the mark is a graphic (not a font) and scales
 * crisply to exactly the width of its container (the gallery bounds).
 * Colour inherits from `currentColor` — the hero sets it to foreground.
 */
const GLYPHS: { d: string; x: number }[] = [
  // S — two softened bumps, open terminals
  {
    x: 0,
    d: "M2.8 1.05 Q2.8 0.25 1.9 0.25 L1.1 0.25 Q0.2 0.25 0.2 1.3 Q0.2 2.35 1.2 2.45 L1.9 2.55 Q2.85 2.65 2.85 3.7 Q2.85 4.75 1.9 4.75 L1.1 4.75 Q0.2 4.75 0.2 3.95",
  },
  // H
  { x: 4.1, d: "M0.2 0.2 V4.8 M2.8 0.2 V4.8 M0.2 2.5 H2.8" },
  // A — rounded apex, straight crossbar
  {
    x: 8.2,
    d: "M0.2 4.8 L1.28 0.66 Q1.5 0.18 1.72 0.66 L2.8 4.8 M0.72 3.35 H2.28",
  },
  // P — rounded bowl
  {
    x: 12.3,
    d: "M0.2 4.8 V0.2 H1.9 A1.3 1.3 0 0 1 1.9 2.8 H0.2",
  },
  // E
  { x: 16.6, d: "M2.8 0.2 H0.2 V4.8 H2.8 M0.2 2.5 H2.35" },
  // 7 — straight diagonal
  { x: 20.7, d: "M0.2 0.2 H2.8 L1.2 4.8" },
  // 2 — arched shoulder, flat foot
  {
    x: 24.8,
    d: "M0.25 1.45 A1.3 1.3 0 0 1 2.8 1.4 C2.8 2.6 1.8 3.25 0.25 4.8 H2.85",
  },
];

export function Shape72Wordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-0.6 -0.6 29.1 6.2"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={0.72}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="presentation"
    >
      {GLYPHS.map((g) => (
        <path key={g.x} d={g.d} transform={`translate(${g.x} 0)`} />
      ))}
    </svg>
  );
}
