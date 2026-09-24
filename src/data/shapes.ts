/*
 * SHAPE72 mock data layer.
 *
 * Pure data + types only — no blockchain assumptions. When the Solana /
 * Metaplex layer lands, replace these constants with real lookups; every
 * presentation component consumes these shapes as-is.
 */

export type ShapeStatus = "available" | "owned" | "yours";

export interface Shape {
  /** Permanent ID, 1–72. Never reshuffled. */
  id: number;
  /** Gallery artwork: /shapes/shape-{id}.svg — the real 72 SVGs drop in here. */
  image: string;
  status: ShapeStatus;
  /** Truncated owner wallet, e.g. "4nD...9kQ". Present when owned. */
  owner?: string;
  /** Mint price in SOL. Free mint: collectors pay Solana network fees only. */
  price: number;
  /** Native-token creator rewards accrued to this Shape, in SOL. */
  rewardsAvailable: number;
}

/** Mint price in SOL. The initial mint is free — network fees only. */
export const PRICE_SOL = 0;

/** User-facing mint wording. */
export const MINT_LABEL = "Free Mint";
export const MINT_NOTE = "Network fees only";

export const TOTAL_SHAPES = 72;

function buildShape(id: number): Shape {
  return {
    id,
    image: `/shapes/shape-${id}.svg`,
    status: "available",
    price: PRICE_SOL,
    rewardsAvailable: 0,
  };
}

/** Local artwork placeholders. Live AVAILABLE/OWNED/YOURS comes from chain status. */
export const SHAPES: Shape[] = Array.from({ length: TOTAL_SHAPES }, (_, i) =>
  buildShape(i + 1),
);

/**
 * Native-token treatment. Flip `launched` to false to preview the
 * pre-launch state ("NOT LIVE YET"). Later the mint address arrives via
 * the project's own CLI/configuration process.
 */
export const CORE_TOKEN = {
  launched: true,
  symbol: "$SHAPE72",
  marketCap: "$842K",
  volume24h: "$1.8M",
  creatorRewards: "18.42 SOL",
  shapePool: "9.21 SOL",
} as const;

export function padShapeId(id: number): string {
  return String(id).padStart(2, "0");
}
