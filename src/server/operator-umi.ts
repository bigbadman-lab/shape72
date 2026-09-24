import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  type Umi,
} from "@metaplex-foundation/umi";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { dedicatedRpcUrl } from "@/server/rpc";
import { requireServerEnv } from "@/server/env";

export function createReadUmi(): Umi {
  return createUmi(dedicatedRpcUrl()).use(mplCore());
}

export function createOperatorUmi(): Umi {
  const keypairPath = requireServerEnv("SHAPE72_OPERATOR_KEYPAIR_PATH");
  const umi = createReadUmi();
  const raw = JSON.parse(readFileSync(resolve(keypairPath), "utf8")) as unknown;
  if (!Array.isArray(raw) || raw.length < 64) {
    throw new Error("Operator keypair file is not a valid Solana JSON secret");
  }
  const keypair = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(raw));
  umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));
  return umi;
}
