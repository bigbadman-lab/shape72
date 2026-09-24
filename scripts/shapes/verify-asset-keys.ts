import { existsSync, readFileSync } from "node:fs";
import { Keypair } from "@solana/web3.js";
import { loadOperatorEnv } from "../lib/env";
import { assetKeypairPath, padShapeId } from "./paths";
import production from "../../config/shapes.production.json";

function loadKeypair(id: number): Keypair {
  const file = assetKeypairPath(id);
  if (!existsSync(file)) {
    throw new Error(`Missing asset keypair for Shape ${padShapeId(id)}`);
  }
  const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
  if (!Array.isArray(raw) || raw.length < 64) {
    throw new Error(`Invalid asset keypair for Shape ${padShapeId(id)}`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function main() {
  loadOperatorEnv();
  const rows: { shape: string; assetAddress: string; matchesManifest: boolean }[] = [];
  const addresses = new Set<string>();

  for (let id = 2; id <= 72; id += 1) {
    const keypair = loadKeypair(id);
    const assetAddress = keypair.publicKey.toBase58();
    if (addresses.has(assetAddress)) {
      throw new Error(`Duplicate asset address at Shape ${padShapeId(id)}`);
    }
    addresses.add(assetAddress);
    const manifest = (production as { id: number; assetAddress?: string }[]).find(
      (entry) => entry.id === id,
    );
    rows.push({
      shape: padShapeId(id),
      assetAddress,
      matchesManifest: !manifest?.assetAddress || manifest.assetAddress === assetAddress,
    });
  }

  const unique = new Set(rows.map((row) => row.assetAddress)).size;
  console.log(
    JSON.stringify(
      {
        files: `${rows.length} / 71`,
        uniqueAddresses: unique,
        mismatches: rows.filter((row) => !row.matchesManifest).map((row) => row.shape),
        addresses: rows,
      },
      null,
      2,
    ),
  );
  if (rows.length !== 71 || unique !== 71 || rows.some((row) => !row.matchesManifest)) {
    throw new Error("Asset key verification failed");
  }
}

main();
