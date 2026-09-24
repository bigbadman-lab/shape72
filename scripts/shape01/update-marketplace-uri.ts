import { readFileSync } from "node:fs";
import { fetchAsset, fetchCollection, update } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { loadOperatorEnv, optionalEnv, requiredEnv } from "../lib/env";
import { MPL_CORE_PROGRAM } from "../collection/constants";
import { assertMainnetRpc } from "../collection/rpc";
import { createOperatorUmi } from "../collection/umi";
import { localMetadataPath } from "../shapes/paths";
import {
  CONFIRM_SHAPE01_METADATA_UPDATE,
  SHAPE01_ASSET,
  SHAPE01_COLLECTION,
  SHAPE01_NAME,
  SHAPE01_OLD_METADATA_URI,
  SHAPE01_OPERATOR,
  SHAPE01_OWNER,
  SHAPE01_SVG_URI,
} from "./marketplace-constants";

const ALLOWED_PROGRAMS = new Set([
  "11111111111111111111111111111111",
  MPL_CORE_PROGRAM,
  "ComputeBudget111111111111111111111111111111",
  "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV",
]);

type PinataFile = { cid?: string; mime_type?: string };

function cidFrom(uri: string): string | null {
  const match = uri.match(/ipfs:\/\/([^/?#]+)/i);
  return match ? match[1] : null;
}

async function pinataFile(cid: string): Promise<PinataFile | null> {
  const jwt = optionalEnv("PINATA_JWT");
  if (!jwt) return null;
  const response = await fetch(
    `https://api.pinata.cloud/v3/files/public?cid=${encodeURIComponent(cid)}`,
    { headers: { Authorization: `Bearer ${jwt}` }, signal: AbortSignal.timeout(20_000) },
  );
  if (!response.ok) return null;
  const json = (await response.json()) as { data?: { files?: PinataFile[] } };
  return json.data?.files?.[0] || null;
}

async function main() {
  loadOperatorEnv();
  await assertMainnetRpc();

  const newUri = requiredEnv("SHAPE01_MARKETPLACE_METADATA_URI");
  const pngUri = requiredEnv("SHAPE01_MARKETPLACE_PNG_URI");
  const keypairPath = requiredEnv("SHAPE72_OPERATOR_KEYPAIR_PATH");
  const confirm = optionalEnv("SHAPE72_CONFIRM_SHAPE01_METADATA_UPDATE");

  const umi = createOperatorUmi(keypairPath);
  const operator = umi.identity.publicKey.toString();
  const collection = await fetchCollection(umi, publicKey(SHAPE01_COLLECTION));
  const asset = await fetchAsset(umi, publicKey(SHAPE01_ASSET));
  const authority = asset.updateAuthority as {
    type?: string;
    address?: { toString(): string } | string;
  };
  const authorityAddress =
    authority.address === undefined ? "" : authority.address.toString();

  const pngCid = cidFrom(pngUri);
  const metaCid = cidFrom(newUri);
  const hostedPng = pngCid ? await pinataFile(pngCid) : null;
  const hostedMeta = metaCid ? await pinataFile(metaCid) : null;
  const hostedJson = JSON.parse(readFileSync(localMetadataPath(1), "utf8")) as {
    name?: string;
    image?: string;
    attributes?: { trait_type?: string; value?: string }[];
    properties?: { files?: { uri?: string; type?: string }[] };
  };

  const attr = (trait: string) =>
    hostedJson?.attributes?.find((item) => item.trait_type === trait)?.value || "";
  const files = hostedJson?.properties?.files || [];

  const checks = {
    assetExists: Boolean(asset.publicKey),
    ownerUnchanged: asset.owner.toString() === SHAPE01_OWNER,
    collectionUnchanged:
      authority.type === "Collection" && authorityAddress === SHAPE01_COLLECTION,
    numMintedIsOne: collection.numMinted === 1,
    currentSizeIsOne: collection.currentSize === 1,
    currentUriIsOld: asset.uri === SHAPE01_OLD_METADATA_URI,
    nameUnchanged: asset.name === SHAPE01_NAME,
    pngResolves: hostedPng?.mime_type === "image/png",
    metadataResolves: Boolean(hostedMeta && /json/i.test(hostedMeta.mime_type || "")),
    jsonName: hostedJson?.name === SHAPE01_NAME,
    jsonImageIsPng: hostedJson?.image === pngUri,
    attributesUnchanged:
      attr("Shape") === "01" && attr("Edition") === "1/1" && attr("Series") === "Genesis 72",
    filesContainPng: files.some((file) => file.uri === pngUri && file.type === "image/png"),
    filesContainSvg:
      files.some((file) => file.uri === SHAPE01_SVG_URI && file.type === "image/svg+xml"),
    svgCidUnchanged: files.some((file) => file.uri === SHAPE01_SVG_URI),
    operatorMatches: operator === SHAPE01_OPERATOR,
    collectionAuthorityMatches: collection.updateAuthority.toString() === SHAPE01_OPERATOR,
  };

  const builder = update(umi, {
    asset,
    collection,
    uri: newUri,
  });
  const programs = [
    ...new Set(builder.items.map((item) => item.instruction.programId.toString())),
  ];
  const unexpectedPrograms = programs.filter((program) => !ALLOWED_PROGRAMS.has(program));

  const preflight = {
    stage: "preflight",
    assetAddress: SHAPE01_ASSET,
    currentUri: asset.uri,
    proposedUri: newUri,
    pngUri,
    owner: asset.owner.toString(),
    collection: SHAPE01_COLLECTION,
    expectedPrograms: programs,
    expectedSigner: operator,
    applicationSolTransfer: 0,
    checks,
    unexpectedPrograms,
  };
  console.log(JSON.stringify(preflight, null, 2));

  const failed = Object.entries(checks).filter(([, ok]) => !ok);
  if (failed.length > 0) {
    throw new Error(`Preflight failed: ${failed.map(([key]) => key).join(", ")}`);
  }
  if (unexpectedPrograms.length > 0) {
    throw new Error("Update transaction contains unexpected program ids");
  }
  if (newUri === asset.uri) {
    throw new Error("Proposed URI is already on-chain");
  }

  if (confirm !== CONFIRM_SHAPE01_METADATA_UPDATE) {
    console.log(
      JSON.stringify(
        {
          stage: "ready",
          next: "Re-run with SHAPE72_CONFIRM_SHAPE01_METADATA_UPDATE=YES to broadcast exactly one Shape 01 metadata URI update.",
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  const result = await builder.sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });
  const signature = base58.deserialize(result.signature)[0];
  let after = await fetchAsset(umi, publicKey(SHAPE01_ASSET));
  if (after.uri !== newUri) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    after = await fetchAsset(umi, publicKey(SHAPE01_ASSET));
  }
  const afterCollection = await fetchCollection(umi, publicKey(SHAPE01_COLLECTION));
  const afterAuthority = after.updateAuthority as {
    type?: string;
    address?: { toString(): string } | string;
  };
  const afterAuthorityAddress =
    afterAuthority.address === undefined ? "" : afterAuthority.address.toString();

  const post = {
    stage: "updated",
    transactionSignature: signature,
    assetAddress: after.publicKey.toString(),
    owner: after.owner.toString(),
    collection: SHAPE01_COLLECTION,
    updateAuthority: after.updateAuthority,
    oldUri: SHAPE01_OLD_METADATA_URI,
    newUri: after.uri,
    name: after.name,
    collectionNumMinted: afterCollection.numMinted,
    collectionCurrentSize: afterCollection.currentSize,
    checks: {
      addressUnchanged: after.publicKey.toString() === SHAPE01_ASSET,
      ownerUnchanged: after.owner.toString() === SHAPE01_OWNER,
      collectionUnchanged:
        afterAuthority.type === "Collection" && afterAuthorityAddress === SHAPE01_COLLECTION,
      uriUpdated: after.uri === newUri,
      nameUnchanged: after.name === SHAPE01_NAME,
      numMintedIsOne: afterCollection.numMinted === 1,
      currentSizeIsOne: afterCollection.currentSize === 1,
    },
  };
  console.log(JSON.stringify(post, null, 2));
  if (Object.values(post.checks).some((ok) => !ok)) {
    throw new Error("Shape 01 updated but post-verification failed");
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Shape 01 metadata update failed";
  console.error(message);
  process.exit(1);
});
