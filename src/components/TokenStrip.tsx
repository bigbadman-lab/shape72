"use client";

import { useEffect, useState } from "react";
import {
  TOKEN_DISPLAY,
  formatPct,
  formatUsd,
  parseTokenConfig,
  pumpFunCoinUrl,
  type TokenRuntimeConfig,
} from "@/data/token";
import type { TokenMarketPayload } from "@/data/token";
import { shortenAddress } from "@/lib/solana";

type MarketView = TokenMarketPayload;

function prelaunchMarket(): MarketView {
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

function statusCopy(market: MarketView, token: TokenRuntimeConfig): string {
  if (!token.active) return "Coming soon";
  if (market.status === "indexing") return "Market data indexing";
  if (market.status === "degraded") return "Market data degraded";
  if (market.status === "live") return "Live";
  return "Coming soon";
}

export function TokenStrip() {
  const [token, setToken] = useState<TokenRuntimeConfig>({ active: false, symbol: "72" });
  const [market, setMarket] = useState<MarketView>(prelaunchMarket());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void Promise.all([
        fetch("/api/token", { cache: "no-store" }).then((response) => response.json()),
        fetch("/api/token/market", { cache: "no-store" }).then((response) => response.json()),
      ])
        .then(([tokenPayload, marketPayload]) => {
          if (cancelled) return;
          setToken(parseTokenConfig(tokenPayload));
          setMarket(marketPayload as MarketView);
        })
        .catch(() => {
          if (cancelled) return;
          setToken({ active: false, symbol: "72" });
          setMarket(prelaunchMarket());
        });
    };
    load();
    const timer = window.setInterval(load, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const mint = token.active ? token.mint : undefined;
  const tradeUrl = mint ? pumpFunCoinUrl(mint) : null;
  const stats = [
    { label: "Price", value: formatUsd(market.priceUsd) },
    { label: "Market Cap", value: formatUsd(market.marketCapUsd) },
    { label: "24H Volume", value: formatUsd(market.volume24hUsd) },
    { label: "24H Change", value: formatPct(market.change24hPct) },
  ];

  const copyMint = async () => {
    if (!mint) return;
    await navigator.clipboard.writeText(mint);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="mt-28 sm:mt-40" aria-label="Core token">
      <div className="border-t border-border pt-8">
        <div className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Core Token
        </div>
        <div className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-foreground sm:text-6xl">
          {TOKEN_DISPLAY}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
        <span className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {statusCopy(market, token)}
        </span>
      </div>

      {mint ? (
        <div className="mt-10 border border-border p-6 sm:p-8">
          <div className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            $72 is live
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border px-3 py-1 font-display text-[10px] uppercase tracking-[0.25em] text-foreground">
              Official
            </span>
            <span className="font-display text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Official mint
            </span>
          </div>
          <div className="mt-4 hidden break-all font-display text-sm tracking-tight text-foreground sm:block">
            {mint}
          </div>
          <div className="mt-4 font-display text-sm tracking-tight text-foreground sm:hidden">
            {shortenAddress(mint, 6, 6)}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void copyMint()}
              className="inline-flex rounded-full border border-border px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.25em] text-foreground transition-colors hover:border-foreground/40"
            >
              {copied ? "Copied" : "Copy mint"}
            </button>
            {tradeUrl ? (
              <a
                href={tradeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-border px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.25em] text-foreground transition-colors hover:border-foreground/40"
              >
                Trade $72
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {mint && market.status === "live" ? (
        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-background p-6 sm:p-8">
              <dt className="font-display text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="mt-3 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : mint ? (
        <div className="mt-10 font-display text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {market.status === "degraded" ? "Market data unavailable —" : "Market data indexing"}
        </div>
      ) : null}
    </section>
  );
}
