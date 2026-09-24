import { optionalEnv } from "../lib/env";
import { DISABLED_MINT, MINT_CONFIG_KEY, parseMintConfig, type MintRuntimeConfig } from "../../src/data/mint";

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

export function hasMintConfigCredentials(): boolean {
  return Boolean(optionalEnv("VERCEL_TOKEN") && optionalEnv("VERCEL_GLOBAL_CONFIG_ID"));
}

export function mintConfigStoreId(): string {
  return optionalEnv("VERCEL_GLOBAL_CONFIG_ID");
}

export async function readProductionMint(): Promise<MintRuntimeConfig> {
  if (!hasMintConfigCredentials()) return { ...DISABLED_MINT };
  const response = await fetch(storeUrl(`/item/${MINT_CONFIG_KEY}`), {
    headers: managementHeaders(),
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 404 || response.status === 204) return { ...DISABLED_MINT };
  if (!response.ok) {
    throw new Error(`BLOCKED — GLOBAL CONFIG READ FAILED (${response.status})`);
  }
  const json = (await response.json()) as { item?: { value?: unknown }; value?: unknown };
  return parseMintConfig(json.item?.value ?? json.value);
}

export async function writeProductionMint(value: MintRuntimeConfig): Promise<void> {
  if (!hasMintConfigCredentials()) {
    throw new Error("BLOCKED — VERCEL GLOBAL CONFIG CREDENTIALS MISSING");
  }
  const response = await fetch(storeUrl("/items"), {
    method: "PATCH",
    headers: managementHeaders(),
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      items: [{ operation: "upsert", key: MINT_CONFIG_KEY, value }],
    }),
  });
  if (!response.ok) {
    throw new Error(`FAILED — GLOBAL CONFIG WRITE (${response.status})`);
  }
}
