"use client";

import { useEffect, useRef, useState } from "react";
import { padShapeId, type Shape } from "@/data/shapes";

interface ShapeTileProps {
  shape: Shape;
  walletConnected: boolean;
  onOpen: () => void;
}

function statusLabel(shape: Shape, walletConnected: boolean): string {
  if (shape.status === "available") return "AVAILABLE";
  if (shape.status === "yours") return walletConnected ? "YOURS" : "OWNED";
  return "OWNED";
}

export function ShapeTile({ shape, walletConnected, onOpen }: ShapeTileProps) {
  const [broken, setBroken] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Some 404 responses never fire the error event — check decode state.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setBroken(true);
  }, [shape.image]);
  const isYours = walletConnected && shape.status === "yours";
  const rewardsActive = shape.status === "owned" || shape.status === "yours";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Shape ${padShapeId(shape.id)} — ${statusLabel(shape, walletConnected)}`}
      className="group relative block aspect-square w-full rounded-3xl bg-card text-left transition-colors duration-300 hover:bg-[#161616] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {/* Artwork is the primary object; it fills most of the tile. */}
      <div className="absolute inset-0 grid place-items-center px-8 pb-10 pt-6 sm:px-10">
        {broken ? (
          // Temporary typographic stand-in until the real SVGs are supplied.
          <span className="font-display text-5xl font-bold tracking-tighter text-primary/80 sm:text-6xl">
            {padShapeId(shape.id)}
          </span>
        ) : (
          <span className="relative flex max-h-[72%] w-3/5 transition-transform duration-300 ease-out group-hover:scale-[1.06]">
            {/* Hidden decode probe; visible orange comes from the CSS mask. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={shape.image}
              alt={`Shape ${padShapeId(shape.id)}`}
              loading="lazy"
              draggable={false}
              onError={() => setBroken(true)}
              className="h-full w-full object-contain opacity-0"
            />
            <span
              aria-hidden
              className="shape-mask"
              style={{ ["--shape-src" as string]: `url("${shape.image}")` }}
            />
          </span>
        )}
      </div>

      {/* Understated metadata strip. */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 pb-4 font-display text-[10px] uppercase tracking-[0.18em] sm:px-5">
        <span className="whitespace-nowrap text-muted-foreground">
          Shape {padShapeId(shape.id)}
        </span>
        <span
          className={
            isYours
              ? "text-primary"
              : shape.status === "available"
                ? "text-foreground/60"
                : "text-muted-foreground"
          }
        >
          {statusLabel(shape, walletConnected)}
        </span>
      </div>

      {/* A quiet live signal: rewards stay secondary to the artwork. */}
      {rewardsActive && (
        <div className="absolute right-3 top-4 flex items-center gap-2 font-display text-[9px] uppercase tracking-[0.16em] text-primary sm:right-5 sm:text-[10px] sm:tracking-[0.18em]">
          <span
            aria-hidden
            className="reward-live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
          />
          <span className="whitespace-nowrap">
            {isYours && shape.rewardsAvailable > 0
              ? `+${shape.rewardsAvailable.toFixed(3)} SOL`
              : "Rewards live"}
          </span>
        </div>
      )}
    </button>
  );
}
