"use client";

import { useEffect, useRef, useState } from "react";
import {
  MINT_LABEL,
  MINT_NOTE,
  padShapeId,
  TOTAL_SHAPES,
  type Shape,
} from "@/data/shapes";
import type { Shape01ClaimPhase } from "@/lib/shape01-claim";

interface ShapeModalProps {
  shape: Shape | null;
  walletConnected: boolean;
  claimPhase?: Shape01ClaimPhase;
  onClose: () => void;
  onClaim: (id: number) => void;
  onClaimRewards: (id: number) => void;
}

function claimCopy(phase: Shape01ClaimPhase): string {
  if (phase === "preparing") return "Preparing";
  if (phase === "awaiting-signature") return "Awaiting signature";
  if (phase === "confirming") return "Confirming";
  return MINT_NOTE;
}

/**
 * Minimal claim experience — a natural extension of the gallery, not a
 * wizard. Solid near-black panel, oversized artwork, one action.
 */
export function ShapeModal({
  shape,
  walletConnected,
  claimPhase = "idle",
  onClose,
  onClaim,
  onClaimRewards,
}: ShapeModalProps) {
  const [brokenForId, setBrokenForId] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const broken = shape ? brokenForId === shape.id : false;

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0 && shape) {
      setBrokenForId(shape.id);
    }
  }, [shape]);
  useEffect(() => {
    if (!shape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shape, onClose]);

  useEffect(() => {
    document.body.style.overflow = shape ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [shape]);

  if (!shape) return null;

  const isYours = walletConnected && shape.status === "yours";
  const rewardsActive = shape.status === "owned" || shape.status === "yours";
  const pad = padShapeId(shape.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Shape ${pad}`}
    >
      <div
        className="absolute inset-0 bg-background/95 animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-4xl bg-card p-7 text-center animate-in fade-in zoom-in-95 duration-200 sm:p-9">
        <div className="flex items-center justify-between font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Shape {pad}</span>
          <button
            type="button"
            onClick={onClose}
            className="transition-colors hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="mx-auto my-8 grid h-52 w-52 place-items-center sm:h-60 sm:w-60">
          {broken ? (
            <span className="font-display text-7xl font-bold tracking-tighter text-primary/80">
              {pad}
            </span>
          ) : (
            <span className="relative flex max-h-full w-full">
              {/* Hidden decode probe; visible orange comes from the CSS mask. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={shape.image}
                alt={`Shape ${pad}`}
                draggable={false}
                onError={() => setBrokenForId(shape.id)}
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

        <div className="font-display text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          One of {TOTAL_SHAPES}
        </div>

        {shape.status === "available" ? (
          <>
            <div className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-foreground">
              {MINT_LABEL}
            </div>
            <div className="mt-3 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {shape.id === 1 ? claimCopy(claimPhase) : MINT_NOTE}
            </div>
          </>
        ) : isYours ? (
          <>
            <div className="mt-2 font-display text-3xl font-bold tracking-tight text-primary">
              Yours
            </div>
          </>
        ) : (
          <>
            <div className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
              Owned
            </div>
            <div className="mt-4 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {shape.owner}
            </div>
          </>
        )}

        <div className="mt-6 border-y border-border py-5 text-left">
          <div className="flex items-center justify-between gap-4 font-display text-[9px] uppercase tracking-[0.2em]">
            <span className="text-muted-foreground">Creator rewards</span>
            <span
              className={
                rewardsActive
                  ? "flex items-center gap-2 text-primary"
                  : "text-muted-foreground"
              }
            >
              {rewardsActive && (
                <span
                  aria-hidden
                  className="reward-live-dot h-1.5 w-1.5 rounded-full bg-primary"
                />
              )}
              {rewardsActive ? "Live" : "Included"}
            </span>
          </div>

          <div className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
            {isYours && shape.rewardsAvailable > 0
              ? `${shape.rewardsAvailable.toFixed(3)} SOL`
              : rewardsActive
                ? "Reward share active"
                : "Equal reward share"}
          </div>

          <p className="mt-3 font-display text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
            This Shape carries an equal share of creator rewards. Rewards belong
            to the Shape and transfer with the NFT.
          </p>
        </div>

        {shape.status === "available" && (
          <button
            type="button"
            disabled={shape.id === 1 && claimPhase !== "idle"}
            onClick={() => onClaim(shape.id)}
            className="mt-6 w-full rounded-full bg-primary py-4 font-display text-xs font-bold uppercase tracking-[0.25em] text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:opacity-60"
          >
            Claim Shape
          </button>
        )}

        {isYours && shape.rewardsAvailable > 0 && (
          <button
            type="button"
            onClick={() => onClaimRewards(shape.id)}
            className="mt-6 w-full rounded-full border border-primary py-4 font-display text-xs font-bold uppercase tracking-[0.25em] text-primary transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
          >
            Claim Rewards
          </button>
        )}
      </div>
    </div>
  );
}
