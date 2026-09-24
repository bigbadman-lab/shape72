"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/components/AppKitProvider";

const controlClassName =
  "rounded-full border border-border bg-card px-5 py-2.5 font-display text-[10px] tracking-[0.25em] text-foreground transition-colors duration-200 hover:border-foreground/40";

export function WalletControl() {
  const { configured, isConnected, shortAddress, status, connect, disconnect } =
    useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tried, setTried] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hint =
    tried && !isConnected && (status === "unavailable" || !configured)
      ? "Unavailable"
      : null;

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const onConnect = async () => {
    setTried(true);
    if (!configured) return;
    await connect();
  };

  const onDisconnect = async () => {
    setMenuOpen(false);
    await disconnect();
  };

  if (isConnected && shortAddress) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className={controlClassName}
        >
          {shortAddress}
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-2 min-w-full rounded-full border border-border bg-card"
          >
            <button
              type="button"
              role="menuitem"
              onClick={onDisconnect}
              className="w-full px-5 py-2.5 text-left font-display text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onConnect}
        aria-busy={status === "connecting"}
        className={`${controlClassName} uppercase`}
      >
        Connect
      </button>
      {hint && (
        <span className="absolute right-0 top-full mt-2 whitespace-nowrap font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          {hint ?? "Unavailable"}
        </span>
      )}
    </div>
  );
}
