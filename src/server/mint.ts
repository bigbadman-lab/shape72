import "server-only";
import { create, fetchCollection } from "@metaplex-foundation/mpl-core";
import {
  createNoopSigner,
  publicKey,
  signTransaction,
} from "@metaplex-foundation/umi";
import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
import { Connection, PublicKey } from "@solana/web3.js";
import { requireManifestEntry } from "@/data/manifest";
import { padShapeId } from "@/data/shapes";
import { isSolanaAddress } from "@/lib/solana";
import { loadPredeterminedAssetSigner } from "@/server/asset-signer";
import { EXPECTED_COLLECTION, EXPECTED_OPERATOR } from "@/server/constants";
import { isPublicMintEnabled, serverEnv } from "@/server/env";
import { createOperatorUmi } from "@/server/operator-umi";
import {
  COMPUTE_BUDGET_PROGRAM,
  MPL_CORE_PROGRAM,
  SPL_NOOP_PROGRAM,
  SYSTEM_PROGRAM,
  assertMainnetRpc,
  dedicatedRpcUrl,
} from "@/server/rpc";

const ALLOWED_PROGRAMS = new Set([
  SYSTEM_PROGRAM,
  MPL_CORE_PROGRAM,
  COMPUTE_BUDGET_PROGRAM,
  SPL_NOOP_PROGRAM,
]);

export class ShapePrepareError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ShapePrepareError";
  }
}

function isDurableUri(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol === "ipfs:" || url.protocol === "ar:" || url.protocol === "arweave:") {
      return Boolean(url.hostname || url.pathname.replace(/^\//, ""));
    }
    if (url.protocol !== "https:") return false;
    if (/localhost|127\.0\.0\.1|vercel\.app/i.test(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export function parseShapeId(raw: string): number {
  if (!/^[0-9]+$/.test(raw)) {
    throw new ShapePrepareError("INVALID_SHAPE", "Shape id must be an integer 1–72", 400);
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1 || id > 72) {
    throw new ShapePrepareError("INVALID_SHAPE", "Shape id must be an integer 1–72", 400);
  }
  return id;
}

export async function assetAccountExists(assetAddress: string): Promise<boolean> {
  const connection = new Connection(dedicatedRpcUrl(), "confirmed");
  const info = await connection.getAccountInfo(new PublicKey(assetAddress), "confirmed");
  return Boolean(info);
}

export async function prepareShapeClaim(id: number, claimant: string) {
  return assembleShapeClaim(id, claimant, { requirePublicMint: true });
}

export async function rehearseShapeClaim(id: number, claimant: string) {
  return assembleShapeClaim(id, claimant, { requirePublicMint: false });
}

async function assembleShapeClaim(
  id: number,
  claimant: string,
  options: { requirePublicMint: boolean },
) {
  const entry = requireManifestEntry(id);
  if (!isSolanaAddress(entry.assetAddress)) {
    throw new ShapePrepareError("MANIFEST_INCOMPLETE", "Shape asset address is missing", 503);
  }

  if (await assetAccountExists(entry.assetAddress)) {
    throw new ShapePrepareError(
      "SHAPE_ALREADY_CLAIMED",
      `Shape ${padShapeId(id)} is already claimed`,
      409,
    );
  }

  if (options.requirePublicMint && !isPublicMintEnabled()) {
    throw new ShapePrepareError(
      "MINT_DISABLED",
      "Public mint is not live",
      403,
    );
  }

  if (!isDurableUri(entry.metadataUri) || !isDurableUri(entry.imageUri)) {
    throw new ShapePrepareError(
      "METADATA_URI_REQUIRED",
      `Shape ${padShapeId(id)} metadata URI is missing`,
      503,
    );
  }

  await assertMainnetRpc();
  const collectionAddress = serverEnv("SHAPE72_COLLECTION_ADDRESS") || EXPECTED_COLLECTION;
  if (collectionAddress !== EXPECTED_COLLECTION) {
    throw new ShapePrepareError("COLLECTION_MISMATCH", "Unexpected collection address", 503);
  }

  if (!isSolanaAddress(claimant)) {
    throw new ShapePrepareError("INVALID_CLAIMANT", "Claimant public key is invalid", 400);
  }

  const umi = createOperatorUmi();
  const operator = umi.identity.publicKey.toString();
  if (operator !== EXPECTED_OPERATOR) {
    throw new ShapePrepareError("AUTHORITY_MISMATCH", "Operator public key mismatch", 503);
  }

  const collection = await fetchCollection(umi, publicKey(collectionAddress));
  if (collection.updateAuthority.toString() !== operator) {
    throw new ShapePrepareError("AUTHORITY_MISMATCH", "Collection authority mismatch", 503);
  }

  const asset = loadPredeterminedAssetSigner(umi, id);
  if (asset.publicKey.toString() !== entry.assetAddress) {
    throw new ShapePrepareError(
      "ASSET_ADDRESS_MISMATCH",
      "Predetermined asset signer does not match the production manifest",
      500,
    );
  }

  const claimantKey = publicKey(claimant);
  const payer = createNoopSigner(claimantKey);
  const builder = create(umi, {
    asset,
    name: entry.name,
    uri: entry.metadataUri,
    owner: claimantKey,
    payer,
    authority: umi.identity,
    collection,
  }).setFeePayer(payer);

  const programs = [
    ...new Set(builder.items.map((item) => item.instruction.programId.toString())),
  ];
  if (programs.some((program) => !ALLOWED_PROGRAMS.has(program))) {
    throw new ShapePrepareError(
      "UNEXPECTED_INSTRUCTIONS",
      "Prepared transaction contains unexpected program ids",
      500,
    );
  }

  const compiled = await builder.buildWithLatestBlockhash(umi);
  const partiallySigned = await signTransaction(compiled, [asset, umi.identity]);
  const web3Tx = toWeb3JsTransaction(partiallySigned);

  return {
    transaction: Buffer.from(web3Tx.serialize()).toString("base64"),
    assetAddress: entry.assetAddress,
    collectionAddress,
    metadataUri: entry.metadataUri,
    name: entry.name,
    feePayer: claimant,
    programs,
    applicationSolTransfer: 0,
  };
}

export function predeterminedAssetAddress(id: number): string {
  return requireManifestEntry(id).assetAddress;
}
