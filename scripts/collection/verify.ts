import { fetchCollection } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { loadOperatorEnv, optionalEnv, requiredEnv } from "../lib/env";
import {
  COLLECTION_NAME,
  MPL_CORE_PROGRAM,
} from "./constants";
import { assertMainnetRpc } from "./rpc";
import { createOperatorUmi } from "./umi";

async function main() {
  loadOperatorEnv();
  await assertMainnetRpc();

  const collectionAddress = requiredEnv("SHAPE72_COLLECTION_ADDRESS");
  const expectedUri = optionalEnv("SHAPE72_COLLECTION_METADATA_URI");
  const keypairPath = optionalEnv("SHAPE72_OPERATOR_KEYPAIR_PATH");
  if (!keypairPath) {
    throw new Error("SHAPE72_OPERATOR_KEYPAIR_PATH is missing");
  }

  const umi = createOperatorUmi(keypairPath);
  const collection = await fetchCollection(umi, publicKey(collectionAddress));

  const operator = umi.identity.publicKey.toString();
  const nameOk = collection.name === COLLECTION_NAME;
  const uriOk = expectedUri ? collection.uri === expectedUri : Boolean(collection.uri);
  const authorityOk = collection.updateAuthority.toString() === operator;
  const recordedShape01 = optionalEnv("SHAPE72_SHAPE_01_ASSET_ADDRESS");
  const expectedMinted = recordedShape01 ? 1 : 0;
  const mintedCountOk =
    collection.numMinted === expectedMinted &&
    collection.currentSize === expectedMinted;
  const notImmutable = Boolean(collection.updateAuthority);

  const report = {
    network: "solana-mainnet",
    collectionAddress,
    name: collection.name,
    uri: collection.uri,
    updateAuthority: collection.updateAuthority.toString(),
    authorityType: "operator-signer / Core updateAuthority",
    numMinted: collection.numMinted,
    currentSize: collection.currentSize,
    program: MPL_CORE_PROGRAM,
    checks: {
      exists: true,
      isCoreCollection: Boolean(collection.name && collection.uri && collection.updateAuthority),
      nameIsShape72: nameOk,
      metadataUriMatches: uriOk,
      updateAuthorityMatchesOperator: authorityOk,
      canAcceptAssets: notImmutable,
      mintedCountMatchesCanary: mintedCountOk,
    },
  };

  console.log(JSON.stringify(report, null, 2));

  const failed = Object.entries(report.checks).filter(([, ok]) => !ok);
  if (failed.length > 0) {
    throw new Error(`Collection verification failed: ${failed.map(([k]) => k).join(", ")}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Verification failed";
  console.error(message);
  process.exit(1);
});
