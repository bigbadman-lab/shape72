"use client";

import { useEffect, useState } from "react";
import { SHAPES, TOTAL_SHAPES, type Shape, type ShapeStatus } from "@/data/shapes";
import { useWallet } from "@/components/AppKitProvider";
import { Shape72Wordmark } from "@/components/Shape72Wordmark";
import { ShapeGallery } from "@/components/ShapeGallery";
import { ShapeModal } from "@/components/ShapeModal";
import { TokenStrip } from "@/components/TokenStrip";
import { WalletControl } from "@/components/WalletControl";
import { claimShape, type ShapeClaimPhase } from "@/lib/shape-claim";
import { shortenAddress } from "@/lib/solana";

type StatusRow = {
  id: number;
  assetAddress: string;
  status: "available" | "owned";
  owner?: string;
  ownerFull?: string;
};

function applyLiveStatus(
  base: Shape[],
  rows: StatusRow[],
  connectedAddress?: string,
): Shape[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return base.map((shape) => {
    const live = byId.get(shape.id);
    if (!live || live.status === "available") {
      return { ...shape, status: "available" as const, owner: undefined };
    }
    const yours = Boolean(
      connectedAddress && live.ownerFull && live.ownerFull === connectedAddress,
    );
    const status: ShapeStatus = yours ? "yours" : "owned";
    return {
      ...shape,
      status,
      owner: live.owner || (live.ownerFull ? shortenAddress(live.ownerFull) : undefined),
    };
  });
}

export function HomePage() {
  const [shapes, setShapes] = useState<Shape[]>(SHAPES);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [claimPhase, setClaimPhase] = useState<ShapeClaimPhase>("idle");
  const [mintEnabled, setMintEnabled] = useState(false);
  const { isConnected, address, connect, wallet } = useWallet();

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/shapes/status")
      .then((response) => response.json())
      .then((payload: { mintEnabled?: boolean; shapes?: StatusRow[] }) => {
        if (cancelled) return;
        setMintEnabled(payload.mintEnabled === true);
        if (Array.isArray(payload.shapes)) {
          setShapes((prev) => applyLiveStatus(prev, payload.shapes || [], address));
        }
      })
      .catch(() => {
        if (!cancelled) setMintEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const selected = shapes.find((s) => s.id === selectedId) ?? null;

  const claim = (id: number) => {
    if (!mintEnabled) return;
    if (!isConnected) {
      void connect();
      return;
    }
    if (!address || !wallet?.signTransaction) return;
    void claimShape({
      id,
      claimant: address,
      wallet,
      onPhase: setClaimPhase,
    })
      .then(() => {
        setShapes((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, status: "yours" as const, owner: shortenAddress(address) }
              : s,
          ),
        );
        setClaimPhase("idle");
        setSelectedId(null);
      })
      .catch(() => {
        setClaimPhase("idle");
      });
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
        <header className="flex items-center justify-between py-7">
          <span className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            One of one · Solana
          </span>
          <WalletControl />
        </header>

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
          walletConnected={isConnected}
          onOpen={setSelectedId}
        />

        <TokenStrip />

        <footer className="mt-24 border-t border-border py-10 text-center font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Shape72 · {TOTAL_SHAPES} shapes · Free mint
        </footer>
      </div>

      <ShapeModal
        shape={selected}
        walletConnected={isConnected}
        mintEnabled={mintEnabled}
        claimPhase={claimPhase}
        onClose={() => setSelectedId(null)}
        onClaim={claim}
        onClaimRewards={claimRewards}
      />
    </div>
  );
}
