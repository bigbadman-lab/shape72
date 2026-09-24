import "server-only";
import {
  TOKEN_MARKET_CACHE_MS,
  type MarketStatus,
  type TokenMarketPayload,
  type TokenRuntimeConfig,
  isActiveTokenConfig,
  pumpFunCoinUrl,
} from "@/data/token";
import { readTokenRuntime } from "@/server/token/runtime";

export type { TokenMarketPayload };

type CacheRow = { expires: number; payload: TokenMarketPayload };

const cache = new Map<string, CacheRow>();

function prelaunch(): TokenMarketPayload {
  return {
    active: false,
    status: "prelaunch",
    priceUsd: null,
    marketCapUsd: null,
    volume24hUsd: null,
    liquidityUsd: null,
    change24hPct: null,
    venue: null,
    pumpFunUrl: null,
    source: null,
  };
}

function emptyActive(mint: string, status: MarketStatus, source: string | null): TokenMarketPayload {
  return {
    active: true,
    mint,
    status,
    priceUsd: null,
    marketCapUsd: null,
    volume24hUsd: null,
    liquidityUsd: null,
    change24hPct: null,
    venue: null,
    pumpFunUrl: pumpFunCoinUrl(mint),
    source,
  };
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function fetchDexScreener(mint: string): Promise<TokenMarketPayload> {
  const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
    signal: AbortSignal.timeout(8_000),
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`DEXSCREENER_${response.status}`);
  }
  const json = (await response.json()) as {
    pairs?: Array<{
      chainId?: string;
      dexId?: string;
      priceUsd?: string;
      fdv?: number;
      marketCap?: number;
      liquidity?: { usd?: number };
      volume?: { h24?: number };
      priceChange?: { h24?: number };
    }>;
  };
  const pairs = (json.pairs || []).filter((pair) => pair.chainId === "solana");
  if (pairs.length === 0) {
    return emptyActive(mint, "indexing", "dexscreener");
  }
  const best = [...pairs].sort(
    (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0),
  )[0];
  const priceUsd = numberOrNull(best.priceUsd);
  const marketCapUsd = numberOrNull(best.marketCap) ?? numberOrNull(best.fdv);
  const volume24hUsd = numberOrNull(best.volume?.h24);
  const liquidityUsd = numberOrNull(best.liquidity?.usd);
  const change24hPct = numberOrNull(best.priceChange?.h24);
  const usable = [priceUsd, marketCapUsd, volume24hUsd, liquidityUsd].some((value) => value !== null);
  if (!usable) {
    return emptyActive(mint, "indexing", "dexscreener");
  }
  return {
    active: true,
    mint,
    status: "live",
    priceUsd,
    marketCapUsd,
    volume24hUsd,
    liquidityUsd,
    change24hPct,
    venue: best.dexId || "dexscreener",
    pumpFunUrl: pumpFunCoinUrl(mint),
    source: "dexscreener",
  };
}

export async function readTokenMarket(config?: TokenRuntimeConfig): Promise<TokenMarketPayload> {
  const runtime = config || (await readTokenRuntime());
  if (!isActiveTokenConfig(runtime)) return prelaunch();

  const cached = cache.get(runtime.mint);
  if (cached && cached.expires > Date.now()) return cached.payload;

  try {
    const payload = await fetchDexScreener(runtime.mint);
    cache.set(runtime.mint, { expires: Date.now() + TOKEN_MARKET_CACHE_MS, payload });
    return payload;
  } catch {
    const degraded = emptyActive(runtime.mint, "degraded", null);
    cache.set(runtime.mint, {
      expires: Date.now() + TOKEN_MARKET_CACHE_MS,
      payload: degraded,
    });
    return degraded;
  }
}
