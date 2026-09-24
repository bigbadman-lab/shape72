import { existsSync, writeFileSync } from "node:fs";
import { Keypair } from "@solana/web3.js";
import { loadOperatorEnv } from "../lib/env";
import {
  assetKeypairPath,
  ensureAssetKeypairDir,
  padShapeId,
} from "./paths";

function main() {
  loadOperatorEnv();
  const dir = ensureAssetKeypairDir();
  const created: { id: number; assetAddress: string }[] = [];
  const skipped: number[] = [];

  for (let id = 2; id <= 72; id += 1) {
    const file = assetKeypairPath(id);
    if (existsSync(file)) {
      skipped.push(id);
      continue;
    }
    const keypair = Keypair.generate();
    writeFileSync(file, `${JSON.stringify(Array.from(keypair.secretKey))}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    created.push({
      id,
      assetAddress: keypair.publicKey.toBase58(),
    });
  }

  console.log(
    JSON.stringify(
      {
        directory: "outside-repo",
        created: created.map((row) => ({
          shape: padShapeId(row.id),
          assetAddress: row.assetAddress,
        })),
        skippedExisting: skipped.map(padShapeId),
        note: "Private keys were not printed. Set SHAPE72_ASSET_KEYPAIR_DIR in .env.local if it is not already the suggested assets directory.",
      },
      null,
      2,
    ),
  );
}

main();
