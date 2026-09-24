"use client";

import { useEffect, useRef, useState } from "react";
import { TOTAL_SHAPES } from "@/data/shapes";

const ROLL_MS = 1400;

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

export function RemainingMintLabel({
  remaining,
  ready,
}: {
  remaining: number;
  ready: boolean;
}) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!ready) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      shownRef.current = remaining;
      setShown(remaining);
      return;
    }

    const from = shownRef.current;
    const start = performance.now();
    cancelAnimationFrame(frameRef.current);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / ROLL_MS);
      const next = Math.round(from + (remaining - from) * easeOutCubic(progress));
      shownRef.current = next;
      setShown(next);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [ready, remaining]);

  return (
    <span
      className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
      aria-live="polite"
    >
      <span className="tabular-nums text-foreground">{ready ? shown : "—"}</span>
      {" remaining"}
      <span className="sr-only">
        {ready ? `${remaining} of ${TOTAL_SHAPES} shapes remaining` : "Loading remaining mint count"}
      </span>
    </span>
  );
}
