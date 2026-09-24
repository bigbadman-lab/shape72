import { existsSync, readFileSync } from "node:fs";
import { Keypair } from "@solana/web3.js";
import { loadOperatorEnv } from "../lib/env";
import { assetKeypairPath } from "./paths";

function loadIndependent(id: number): string {
  const file = assetKeypairPath(id);
  if (!existsSync(file)) {
    throw new Error(`Missing predetermined keypair for Shape ${id}`);
  }
  const raw = JSON.parse(readFileSync(file, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw)).publicKey.toBase58();
}

function main() {
  loadOperatorEnv();
  const claimantA = "11111111111111111111111111111112";
  const claimantB = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  const fromA = loadIndependent(72);
  const fromB = loadIndependent(72);
  const same = fromA === fromB;
  console.log(
    JSON.stringify(
      {
        shape: 72,
        claimantA,
        claimantB,
        preparedAssetAddressA: fromA,
        preparedAssetAddressB: fromB,
        samePredeterminedAddress: same,
        broadcast: false,
        lock: "Solana account initialization of the predetermined Core Asset address. The first confirmed create wins; the second fails because the account already exists.",
      },
      null,
      2,
    ),
  );
  if (!same) {
    throw new Error("Concurrent preparations derived different asset addresses");
  }
}

main();
