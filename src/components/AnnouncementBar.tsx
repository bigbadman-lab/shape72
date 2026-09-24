"use client";

import { useEffect, useState } from "react";
import { TOKEN_DISPLAY, parseTokenConfig, type TokenRuntimeConfig } from "@/data/token";
import { shortenAddress } from "@/lib/solana";

export function AnnouncementBar() {
  const [token, setToken] = useState<TokenRuntimeConfig>({ active: false, symbol: "72" });

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void fetch("/api/token", { cache: "no-store" })
        .then((response) => response.json())
        .then((payload) => {
          if (!cancelled) setToken(parseTokenConfig(payload));
        })
        .catch(() => {
          if (!cancelled) setToken({ active: false, symbol: "72" });
        });
    };
    load();
    const timer = window.setInterval(load, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const live = Boolean(token.active && token.mint);
  const copy = live
    ? `${TOKEN_DISPLAY} IS LIVE · OFFICIAL MINT ${shortenAddress(token.mint || "")}`
    : `${TOKEN_DISPLAY} — COMING SOON`;

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1180px] items-center justify-center px-6 py-2.5 sm:px-10">
        <p className="font-display text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {copy}
        </p>
      </div>
    </div>
  );
}
