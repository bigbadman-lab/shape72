import "server-only";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  createSignerFromKeypair,
  type Signer,
  type Umi,
} from "@metaplex-foundation/umi";
import { padShapeId } from "@/data/shapes";
import { requireServerEnv } from "@/server/env";

export function loadPredeterminedAssetSigner(umi: Umi, id: number): Signer {
  if (id === 1) {
    throw new Error("Shape 01 already exists and has no replacement asset signer");
  }
  const dir = requireServerEnv("SHAPE72_ASSET_KEYPAIR_DIR");
  const file = resolve(join(dir, `shape-${padShapeId(id)}.json`));
  const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
  if (!Array.isArray(raw) || raw.length < 64) {
    throw new Error(`Asset keypair for Shape ${padShapeId(id)} is invalid`);
  }
  const keypair = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(raw));
  return createSignerFromKeypair(umi, keypair);
}
