export const TOKEN_SYMBOL = "72";
export const TOKEN_DISPLAY = "$72";
export const TOKEN_CONFIG_KEY = "shape72Token";
export const TOKEN_NETWORK = "solana-mainnet" as const;
export const TOKEN_LAUNCH_PLATFORM = "pump.fun" as const;
export const EXPECTED_TOKEN_DECIMALS = 6;
export const TOKEN_MARKET_CACHE_MS = 10_000;

export const PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
export const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
export const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

export const BONDING_CURVE_DISCRIMINATOR = Uint8Array.from([
  23, 183, 248, 55, 96, 216, 172, 96,
]);

export type TokenRuntimeConfig = {
  active: boolean;
  symbol: typeof TOKEN_SYMBOL;
  mint?: string;
  network?: typeof TOKEN_NETWORK;
  launchPlatform?: typeof TOKEN_LAUNCH_PLATFORM;
  activatedAt?: string;
};

export type MarketStatus = "prelaunch" | "indexing" | "live" | "degraded";

export type TokenMarketPayload = {
  active: boolean;
  mint?: string;
  status: MarketStatus;
  priceUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  change24hPct: number | null;
  venue: string | null;
  pumpFunUrl: string | null;
  source: string | null;
};

export const INACTIVE_TOKEN: TokenRuntimeConfig = {
  active: false,
  symbol: TOKEN_SYMBOL,
};

export function pumpFunCoinUrl(mint: string): string {
  return `https://pump.fun/coin/${mint}`;
}

export function isActiveTokenConfig(
  value: TokenRuntimeConfig,
): value is TokenRuntimeConfig & { mint: string } {
  return Boolean(value.active && value.mint);
}

export function parseTokenConfig(value: unknown): TokenRuntimeConfig {
  if (!value || typeof value !== "object") return { ...INACTIVE_TOKEN };
  const row = value as Record<string, unknown>;
  const mint = typeof row.mint === "string" ? row.mint.trim() : "";
  const active = row.active === true && mint.length > 0;
  if (!active) return { ...INACTIVE_TOKEN };
  return {
    active: true,
    symbol: TOKEN_SYMBOL,
    mint,
    network: TOKEN_NETWORK,
    launchPlatform: TOKEN_LAUNCH_PLATFORM,
    activatedAt: typeof row.activatedAt === "string" ? row.activatedAt : undefined,
  };
}

export function formatUsd(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toExponential(2)}`;
}

export function formatPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
