import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchCollection, mplCore } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Connection, PublicKey } from "@solana/web3.js";
import { optionalEnv } from "../lib/env";
import { rpcEndpoint } from "../collection/rpc";
import { productionManifestPath } from "../shapes/paths";
import { readProductionToken } from "../token/global-config";

const EXPECTED_COLLECTION = "4D5Z3iGXSNqamtQ8NzJbkM6WidV5vAvPou5YSfYW5vBk";
const SITE = "https://shape72.fun";

type ManifestEntry = { id: number; assetAddress: string };

export type SignerHealth = {
  operatorPresent: boolean;
  assetSignerCount: number;
  allManifestMatches: boolean;
  backend?: string;
  mintEnabled?: boolean;
};

export async function readSignerHealth(): Promise<SignerHealth> {
  const secretPath = resolve(process.cwd(), ".local/operator-health.secret");
  const secret = existsSync(secretPath) ? readFileSync(secretPath, "utf8").trim() : "";
  if (!secret) {
    throw new Error("BLOCKED — OPERATOR HEALTH SECRET MISSING");
  }
  const response = await fetch(`${SITE}/api/operator/signer-health`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${secret}`,
    },
    body: "{}",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`BLOCKED — SIGNER HEALTH FAILED (${response.status})`);
  }
  return (await response.json()) as SignerHealth;
}

export function assertSignerHealth(health: SignerHealth): void {
  if (
    health.operatorPresent !== true ||
    health.assetSignerCount !== 71 ||
    health.allManifestMatches !== true ||
    health.backend !== "production-secret"
  ) {
    throw new Error("BLOCKED — SIGNER HEALTH FAILED");
  }
}

export async function readCollectionState() {
  const umi = createUmi(rpcEndpoint()).use(mplCore());
  const collection = await fetchCollection(umi, publicKey(EXPECTED_COLLECTION));
  const minted = Number(collection.numMinted);
  const size = Number(collection.currentSize);
  const sane = minted >= 1 && minted <= 72 && size === minted;
  return {
    address: EXPECTED_COLLECTION,
    numMinted: minted,
    currentSize: size,
    exists: true,
    sane,
  };
}

export function loadManifest(): ManifestEntry[] {
  return JSON.parse(readFileSync(productionManifestPath(), "utf8")) as ManifestEntry[];
}

export async function readInventory() {
  const manifest = loadManifest();
  const shape02 = manifest.find((entry) => entry.id === 2);
  if (!shape02?.assetAddress) {
    throw new Error("BLOCKED — SHAPE 02 MISSING FROM MANIFEST");
  }
  const connection = new Connection(rpcEndpoint(), "confirmed");
  const keys = manifest.map((entry) => new PublicKey(entry.assetAddress));
  const infos = await connection.getMultipleAccountsInfo(keys, "confirmed");
  const minted = infos.filter(Boolean).length;
  return {
    uniqueAddresses: new Set(manifest.map((entry) => entry.assetAddress)).size,
    shape02Present: true,
    minted,
    available: manifest.length - minted,
  };
}

export async function readTokenIsolation() {
  const token = await readProductionToken();
  return {
    active: token.active === true,
    mint: token.mint || "none",
  };
}

export async function readSiteMintEnabled(): Promise<boolean | "unreachable"> {
  const appUrl = optionalEnv("SHAPE72_VERIFY_APP_URL") || SITE;
  try {
    const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/shapes/status`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return "unreachable";
    const json = (await response.json()) as { mintEnabled?: boolean };
    return json.mintEnabled === true;
  } catch {
    return "unreachable";
  }
}
