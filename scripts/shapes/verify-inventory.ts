import { readFileSync } from "node:fs";
import { Connection, PublicKey } from "@solana/web3.js";
import { loadOperatorEnv, optionalEnv } from "../lib/env";
import { assertMainnetRpc, rpcEndpoint } from "../collection/rpc";
import { productionManifestPath } from "./paths";

type ManifestEntry = {
  id: number;
  assetAddress: string;
  imageUri: string;
  metadataUri: string;
};

async function main() {
  loadOperatorEnv();
  await assertMainnetRpc();
  const manifest = JSON.parse(readFileSync(productionManifestPath(), "utf8")) as ManifestEntry[];
  const addresses = manifest.map((entry) => entry.assetAddress);
  const unique = new Set(addresses).size;
  const connection = new Connection(rpcEndpoint(), "confirmed");
  const infos = await connection.getMultipleAccountsInfo(
    addresses.filter(Boolean).map((address) => new PublicKey(address)),
    "confirmed",
  );
  const minted = infos.filter(Boolean).length;
  const available = manifest.length - minted;
  const metadataReady = manifest.filter((entry) => entry.imageUri && entry.metadataUri).length;

  const summary = {
    collection: optionalEnv("SHAPE72_COLLECTION_ADDRESS"),
    manifestEntries: manifest.length,
    uniqueAssetAddresses: unique,
    minted,
    available,
    metadataReady,
    shape01Minted: Boolean(infos[0]),
  };

  console.log(
    [
      `collection valid`,
      `${manifest.length} manifest entries`,
      `${unique} asset addresses unique`,
      summary.shape01Minted ? "Shape 01 minted" : "Shape 01 missing",
      `Shapes 02–72 unminted: ${minted <= 1 ? "yes" : "NO"}`,
      `minted total = ${minted}`,
      `available total = ${available}`,
      `metadata = ${metadataReady}/72 valid`,
    ].join("\n"),
  );
  console.log(JSON.stringify(summary, null, 2));

  if (manifest.length !== 72 || unique !== 72 || minted !== 1) {
    throw new Error("Inventory verification failed");
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Inventory verification failed";
  console.error(message);
  process.exit(1);
});
