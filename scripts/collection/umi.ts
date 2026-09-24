import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  type Umi,
} from "@metaplex-foundation/umi";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { rpcEndpoint } from "./rpc";

export function loadOperatorSecret(keypairPath: string): Uint8Array {
  const resolved = resolve(keypairPath);
  const raw = JSON.parse(readFileSync(resolved, "utf8")) as unknown;
  if (!Array.isArray(raw) || raw.length < 64) {
    throw new Error("Operator keypair file is not a valid Solana JSON secret");
  }
  return Uint8Array.from(raw);
}

export function createOperatorUmi(keypairPath: string): Umi {
  const umi = createUmi(rpcEndpoint()).use(mplCore());
  const secret = loadOperatorSecret(keypairPath);
  const keypair = umi.eddsa.createKeypairFromSecretKey(secret);
  umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));
  return umi;
}

export function lamportsToSol(lamports: bigint | number): number {
  return Number(lamports) / 1_000_000_000;
}
