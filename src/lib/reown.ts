"use client";

import { createAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { solana } from "@reown/appkit/networks";
import { getSolanaRpcUrl } from "@/lib/solana";

let initialized = false;

export function getReownProjectId(): string {
  return process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim() ?? "";
}

export function isAppKitConfigured(): boolean {
  return getReownProjectId().length > 0;
}

function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function initAppKit(): boolean {
  if (initialized) return true;
  if (typeof window === "undefined") return false;

  const projectId = getReownProjectId();
  if (!projectId) return false;

  const rpcUrl = getSolanaRpcUrl();

  createAppKit({
    adapters: [new SolanaAdapter()],
    projectId,
    networks: [solana],
    defaultNetwork: solana,
    metadata: {
      name: "SHAPE72",
      description: "72 shapes. Each 1/1.",
      url: getAppUrl(),
      icons: [`${getAppUrl()}/shapes/72pfp.png`],
    },
    themeMode: "dark",
    enableNetworkSwitch: false,
    enableWalletGuide: false,
    features: {
      analytics: false,
      swaps: false,
      onramp: false,
      email: false,
      socials: false,
    },
    customRpcUrls: {
      [solana.caipNetworkId]: [{ url: rpcUrl }],
    },
  });

  initialized = true;
  return true;
}
