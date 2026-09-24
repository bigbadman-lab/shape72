"use client";

import { useEffect, useState } from "react";

/**
 * SHAPE72 hero wordmark — custom vector lettering.
 *
 * Monoline geometric letterforms on a shared 5-unit cap-height grid.
 * On load, each slot holds a decoy glyph for 1s, then sequences through
 * other letters for 3s before settling on S H A P E 7 2.
 */

const TARGET = ["S", "H", "A", "P", "E", "7", "2"] as const;
const POSITIONS = [0, 4.1, 8.2, 12.3, 16.6, 20.7, 24.8];

const DELAY_MS = 1000;
const DURATION_MS = 3000;
const STAGGER_MS = 70;
const TICK_MS = 90;

const PATHS: Record<string, string> = {
  S: "M2.8 1.05 Q2.8 0.25 1.9 0.25 L1.1 0.25 Q0.2 0.25 0.2 1.3 Q0.2 2.35 1.2 2.45 L1.9 2.55 Q2.85 2.65 2.85 3.7 Q2.85 4.75 1.9 4.75 L1.1 4.75 Q0.2 4.75 0.2 3.95",
  H: "M0.2 0.2 V4.8 M2.8 0.2 V4.8 M0.2 2.5 H2.8",
  A: "M0.2 4.8 L1.28 0.66 Q1.5 0.18 1.72 0.66 L2.8 4.8 M0.72 3.35 H2.28",
  P: "M0.2 4.8 V0.2 H1.9 A1.3 1.3 0 0 1 1.9 2.8 H0.2",
  E: "M2.8 0.2 H0.2 V4.8 H2.8 M0.2 2.5 H2.35",
  "7": "M0.2 0.2 H2.8 L1.2 4.8",
  "2": "M0.25 1.45 A1.3 1.3 0 0 1 2.8 1.4 C2.8 2.6 1.8 3.25 0.25 4.8 H2.85",
  B: "M0.2 4.8 V0.2 H1.75 A1.15 1.15 0 0 1 1.75 2.5 H0.2 M1.75 2.5 A1.2 1.2 0 0 1 1.75 4.8 H0.2",
  C: "M2.65 1.05 A1.35 1.35 0 0 0 1.5 0.25 A2.2 2.25 0 0 0 1.5 4.75 A1.35 1.35 0 0 0 2.65 3.95",
  D: "M0.2 4.8 V0.2 H1.45 A2.3 2.3 0 0 1 1.45 4.8 H0.2",
  F: "M0.2 4.8 V0.2 H2.8 M0.2 2.5 H2.25",
  G: "M2.65 1.1 A1.35 1.35 0 0 0 1.5 0.25 A2.2 2.25 0 0 0 1.5 4.75 A1.35 1.35 0 0 0 2.7 3.65 V2.7 H1.55",
  I: "M0.35 0.2 H2.65 M1.5 0.2 V4.8 M0.35 4.8 H2.65",
  J: "M2.55 0.2 V3.35 A1.25 1.25 0 0 1 0.3 3.35",
  K: "M0.2 0.2 V4.8 M2.75 0.25 L0.35 2.5 L2.75 4.75",
  L: "M0.2 0.2 V4.8 H2.8",
  M: "M0.2 4.8 V0.2 L1.5 3.05 L2.8 0.2 V4.8",
  N: "M0.2 4.8 V0.2 L2.8 4.8 V0.2",
  O: "M1.5 0.25 A1.25 2.25 0 1 1 1.5 4.75 A1.25 2.25 0 1 1 1.5 0.25",
  R: "M0.2 4.8 V0.2 H1.8 A1.2 1.2 0 0 1 1.8 2.55 H0.2 M1.25 2.55 L2.8 4.8",
  T: "M0.2 0.2 H2.8 M1.5 0.2 V4.8",
  U: "M0.2 0.2 V3.25 A1.3 1.3 0 0 0 2.8 3.25 V0.2",
  V: "M0.2 0.2 L1.5 4.8 L2.8 0.2",
  X: "M0.25 0.2 L2.75 4.8 M2.75 0.2 L0.25 4.8",
  Y: "M0.2 0.2 L1.5 2.45 L2.8 0.2 M1.5 2.45 V4.8",
  Z: "M0.2 0.2 H2.8 L0.2 4.8 H2.8",
  "0": "M1.5 0.25 A1.15 2.25 0 1 1 1.5 4.75 A1.15 2.25 0 1 1 1.5 0.25",
  "1": "M0.7 1.15 L1.5 0.2 V4.8 M0.45 4.8 H2.55",
  "3": "M0.35 0.2 H2.15 A1.2 1.2 0 0 1 2.15 2.5 H1.2 M2.15 2.5 A1.25 1.25 0 0 1 2.15 4.8 H0.35",
  "4": "M2.15 4.8 V0.2 M2.15 2.65 H0.3 L2.15 0.25",
  "5": "M2.65 0.2 H0.3 V2.4 H1.75 A1.2 1.2 0 0 1 1.75 4.8 H0.4",
  "6": "M2.45 0.55 L1.35 0.25 A2.1 2.2 0 1 0 2.45 3.55",
  "8": "M1.5 0.25 A1.15 1.1 0 1 1 1.5 2.5 A1.15 1.1 0 1 1 1.5 0.25 M1.5 2.5 A1.2 1.15 0 1 1 1.5 4.8 A1.2 1.15 0 1 1 1.5 2.5",
  "9": "M0.55 4.45 L1.65 4.75 A2.1 2.2 0 1 0 0.55 1.45",
};

const POOL = Object.keys(PATHS);

function decoy(slot: number, step: number, target: string) {
  const count = POOL.length;
  let index = (slot * 11 + step * 13 + 3) % count;
  let glyph = POOL[index];
  if (glyph === target) {
    glyph = POOL[(index + 5) % count];
  }
  return glyph;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Shape72Wordmark({ className }: { className?: string }) {
  const [letters, setLetters] = useState<string[]>(() =>
    TARGET.map((letter, slot) => decoy(slot, 0, letter)),
  );

  useEffect(() => {
    if (prefersReducedMotion()) {
      setLetters([...TARGET]);
      return;
    }

    const started = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - started;
      setLetters(
        TARGET.map((letter, slot) => {
          const local = elapsed - DELAY_MS - slot * STAGGER_MS;
          if (local < 0) return decoy(slot, 0, letter);
          if (local >= DURATION_MS) return letter;
          return decoy(slot, Math.floor(local / TICK_MS) + 1, letter);
        }),
      );
      if (elapsed < DELAY_MS + DURATION_MS + STAGGER_MS * (TARGET.length - 1)) {
        frame = requestAnimationFrame(tick);
      } else {
        setLetters([...TARGET]);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

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
      {letters.map((letter, index) => (
        <path
          key={POSITIONS[index]}
          d={PATHS[letter]}
          transform={`translate(${POSITIONS[index]} 0)`}
        />
      ))}
    </svg>
  );
}
