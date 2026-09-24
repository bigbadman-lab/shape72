import { optionalEnv } from "../lib/env";
import {
  TOKEN_CONFIG_KEY,
  TOKEN_LAUNCH_PLATFORM,
  TOKEN_NETWORK,
  TOKEN_SYMBOL,
} from "./constants";

export type StoredToken = {
  active: boolean;
  symbol: string;
  mint?: string;
  network?: string;
  launchPlatform?: string;
  activatedAt?: string;
};

export const INACTIVE_STORED: StoredToken = {
  active: false,
  symbol: TOKEN_SYMBOL,
};

function managementHeaders(): HeadersInit {
  const token = optionalEnv("VERCEL_TOKEN");
  if (!token) {
    throw new Error("BLOCKED — VERCEL TOKEN MISSING");
  }
  return {
    Authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
}

function storeUrl(path = ""): string {
  const id = optionalEnv("VERCEL_GLOBAL_CONFIG_ID");
  if (!id) {
    throw new Error("BLOCKED — VERCEL GLOBAL CONFIG ID MISSING");
  }
  const team = optionalEnv("VERCEL_TEAM_ID");
  const query = team ? `?teamId=${encodeURIComponent(team)}` : "";
  return `https://api.vercel.com/v1/global-config/${id}${path}${query}`;
}

export function hasGlobalConfigCredentials(): boolean {
  return Boolean(optionalEnv("VERCEL_TOKEN") && optionalEnv("VERCEL_GLOBAL_CONFIG_ID"));
}

export async function readProductionToken(): Promise<StoredToken> {
  if (!hasGlobalConfigCredentials()) return { ...INACTIVE_STORED };
  const response = await fetch(storeUrl(`/item/${TOKEN_CONFIG_KEY}`), {
    headers: managementHeaders(),
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 404 || response.status === 204) return { ...INACTIVE_STORED };
  if (!response.ok) {
    throw new Error(`BLOCKED — GLOBAL CONFIG READ FAILED (${response.status})`);
  }
  const json = (await response.json()) as { item?: { value?: unknown }; value?: unknown };
  const value = json.item?.value ?? json.value;
  if (!value || typeof value !== "object") return { ...INACTIVE_STORED };
  const row = value as StoredToken;
  if (row.active === true && typeof row.mint === "string" && row.mint) {
    return {
      active: true,
      symbol: TOKEN_SYMBOL,
      mint: row.mint,
      network: TOKEN_NETWORK,
      launchPlatform: TOKEN_LAUNCH_PLATFORM,
      activatedAt: row.activatedAt,
    };
  }
  return { ...INACTIVE_STORED };
}

export async function writeProductionToken(value: StoredToken): Promise<void> {
  if (!hasGlobalConfigCredentials()) {
    throw new Error("BLOCKED — VERCEL GLOBAL CONFIG CREDENTIALS MISSING");
  }
  const response = await fetch(storeUrl("/items"), {
    method: "PATCH",
    headers: managementHeaders(),
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      items: [{ operation: "upsert", key: TOKEN_CONFIG_KEY, value }],
    }),
  });
  if (!response.ok) {
    throw new Error(`FAILED — GLOBAL CONFIG WRITE (${response.status})`);
  }
}

export function activationObject(mint: string, activatedAt: string): StoredToken {
  return {
    active: true,
    symbol: TOKEN_SYMBOL,
    mint,
    network: TOKEN_NETWORK,
    launchPlatform: TOKEN_LAUNCH_PLATFORM,
    activatedAt,
  };
}
