"use client";

import { useState } from "react";
import {
  MOCK_WALLET,
  SHAPES,
  TOTAL_SHAPES,
  type Shape,
} from "@/data/shapes";
import { Shape72Wordmark } from "@/components/Shape72Wordmark";
import { ShapeGallery } from "@/components/ShapeGallery";
import { ShapeModal } from "@/components/ShapeModal";
import { TokenStrip } from "@/components/TokenStrip";

export function HomePage() {
  const [shapes, setShapes] = useState<Shape[]>(SHAPES);
  const [walletConnected, setWalletConnected] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = shapes.find((s) => s.id === selectedId) ?? null;

  const claim = (id: number) => {
    setShapes((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: "yours" as const, owner: MOCK_WALLET }
          : s,
      ),
    );
    setSelectedId(null);
  };

  const claimRewards = (id: number) => {
    setShapes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, rewardsAvailable: 0 } : s)),
    );
    setSelectedId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
        {/* Top bar — minimal, no conventional navigation. */}
        <header className="flex items-center justify-between py-7">
          <span className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            One of one · Solana
          </span>
          <button
            type="button"
            onClick={() => setWalletConnected((c) => !c)}
            className="rounded-full border border-border bg-card px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.25em] text-foreground transition-colors duration-200 hover:border-foreground/40"
          >
            {walletConnected ? MOCK_WALLET : "Connect"}
          </button>
        </header>

        {/* Wordmark — custom vector lettering, spans the gallery width. */}
        <div className="pt-10 sm:pt-14">
          <h1 className="text-foreground">
            <span className="sr-only">SHAPE72</span>
            <Shape72Wordmark className="block h-auto w-full" />
          </h1>
          <div className="mt-6 flex items-start justify-between gap-6">
            <p className="max-w-sm font-display text-[10px] uppercase leading-relaxed tracking-[0.2em] text-muted-foreground">
              {TOTAL_SHAPES} shapes. Each 1/1. Free mint. Every Shape owns
              an equal share of creator rewards — and that share transfers
              with the NFT.
            </p>
          </div>
        </div>

        <ShapeGallery
          shapes={shapes}
          walletConnected={walletConnected}
          onOpen={setSelectedId}
        />

        <TokenStrip />

        <footer className="mt-24 border-t border-border py-10 text-center font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Shape72 · {TOTAL_SHAPES} shapes · Free mint
        </footer>
      </div>

      <ShapeModal
        shape={selected}
        walletConnected={walletConnected}
        onClose={() => setSelectedId(null)}
        onClaim={claim}
        onClaimRewards={claimRewards}
      />
    </div>
  );
}
