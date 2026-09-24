import { fetchAsset, fetchCollection } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { loadOperatorEnv, optionalEnv, requiredEnv } from "../lib/env";
import { assertMainnetRpc } from "../collection/rpc";
import { createOperatorUmi } from "../collection/umi";
import { COLLECTION_NAME, MPL_CORE_PROGRAM } from "../collection/constants";

const SHAPE01_NAME = "SHAPE 01";

async function main() {
  loadOperatorEnv();
  await assertMainnetRpc();

  const collectionAddress = requiredEnv("SHAPE72_COLLECTION_ADDRESS");
  const assetAddress = requiredEnv("SHAPE72_SHAPE_01_ASSET_ADDRESS");
  const expectedUri = optionalEnv("SHAPE72_SHAPE_01_METADATA_URI");
  const keypairPath = requiredEnv("SHAPE72_OPERATOR_KEYPAIR_PATH");

  const umi = createOperatorUmi(keypairPath);
  const collection = await fetchCollection(umi, publicKey(collectionAddress));
  const asset = await fetchAsset(umi, publicKey(assetAddress));

  const authority = asset.updateAuthority as {
    type?: string;
    address?: { toString(): string } | string;
  };
  const authorityAddress =
    authority.address === undefined ? "" : authority.address.toString();

  const checks = {
    exists: Boolean(asset.publicKey),
    nameIsShape01: asset.name === SHAPE01_NAME,
    metadataUriMatches: expectedUri ? asset.uri === expectedUri : Boolean(asset.uri),
    ownerPresent: Boolean(asset.owner),
    collectionMatches:
      authority.type === "Collection" && authorityAddress === collectionAddress,
    collectionNameIsShape72: collection.name === COLLECTION_NAME,
    collectionHasOneAsset: collection.numMinted === 1,
    programIsMplCore: asset.header.owner.toString() === MPL_CORE_PROGRAM,
  };

  const report = {
    network: "solana-mainnet",
    assetAddress,
    name: asset.name,
    uri: asset.uri,
    owner: asset.owner.toString(),
    collection: collectionAddress,
    collectionNumMinted: collection.numMinted,
    collectionCurrentSize: collection.currentSize,
    updateAuthority: asset.updateAuthority,
    program: MPL_CORE_PROGRAM,
    checks,
  };

  console.log(JSON.stringify(report, null, 2));

  const failed = Object.entries(checks).filter(([, ok]) => !ok);
  if (failed.length > 0) {
    throw new Error(`Shape 01 verification failed: ${failed.map(([k]) => k).join(", ")}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Shape 01 verification failed";
  console.error(message);
  process.exit(1);
});
