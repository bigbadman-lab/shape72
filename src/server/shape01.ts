import "server-only";
import {
  create,
  fetchAsset,
  fetchCollection,
} from "@metaplex-foundation/mpl-core";
import {
  createNoopSigner,
  generateSigner,
  publicKey,
  signTransaction,
} from "@metaplex-foundation/umi";
import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
import { isSolanaAddress } from "@/lib/solana";
import { isCanaryEnabled, serverEnv } from "@/server/env";
import { createOperatorUmi } from "@/server/operator-umi";
import {
  COMPUTE_BUDGET_PROGRAM,
  MPL_CORE_PROGRAM,
  SPL_NOOP_PROGRAM,
  SYSTEM_PROGRAM,
  assertMainnetRpc,
} from "@/server/rpc";

export const SHAPE01_ID = 1;
export const SHAPE01_NAME = "SHAPE 01";
export const EXPECTED_OPERATOR = "G1j79DPv71wGSxunG75aoqwuX3kwCguncU2mHA9GJF2z";

const ALLOWED_PROGRAMS = new Set([
  SYSTEM_PROGRAM,
  MPL_CORE_PROGRAM,
  COMPUTE_BUDGET_PROGRAM,
  SPL_NOOP_PROGRAM,
]);

export class Shape01PrepareError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "Shape01PrepareError";
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

export function assertCanaryArmed(): void {
  if (!isCanaryEnabled()) {
    throw new Shape01PrepareError(
      "CANARY_DISABLED",
      "Shape 01 canary is not enabled",
      403,
    );
  }
}

export async function prepareShape01Claim(claimant: string) {
  assertCanaryArmed();

  if (!isSolanaAddress(claimant)) {
    throw new Shape01PrepareError("INVALID_CLAIMANT", "Claimant public key is invalid", 400);
  }

  const metadataUri = serverEnv("SHAPE72_SHAPE_01_METADATA_URI");
  const imageUri = serverEnv("SHAPE72_SHAPE_01_IMAGE_URI");
  if (!isDurableUri(metadataUri) || !isDurableUri(imageUri)) {
    throw new Shape01PrepareError(
      "METADATA_URI_REQUIRED",
      "BLOCKED — SHAPE 01 METADATA URI REQUIRED",
      503,
    );
  }

  const recordedAsset = serverEnv("SHAPE72_SHAPE_01_ASSET_ADDRESS");
  if (recordedAsset) {
    throw new Shape01PrepareError(
      "ALREADY_MINTED",
      "Shape 01 is already recorded and cannot be minted again",
      409,
    );
  }

  await assertMainnetRpc();

  const collectionAddress = serverEnv("SHAPE72_COLLECTION_ADDRESS");
  if (!isSolanaAddress(collectionAddress)) {
    throw new Shape01PrepareError("COLLECTION_MISSING", "SHAPE72_COLLECTION_ADDRESS is missing", 503);
  }

  const umi = createOperatorUmi();
  const operator = umi.identity.publicKey.toString();
  if (operator !== EXPECTED_OPERATOR) {
    throw new Shape01PrepareError(
      "AUTHORITY_MISMATCH",
      "Operator public key does not match the collection update authority",
      503,
    );
  }

  const collection = await fetchCollection(umi, publicKey(collectionAddress));
  if (collection.updateAuthority.toString() !== operator) {
    throw new Shape01PrepareError(
      "AUTHORITY_MISMATCH",
      "Collection update authority is not the operator",
      503,
    );
  }
  if (collection.numMinted > 0 || collection.currentSize > 0) {
    throw new Shape01PrepareError(
      "ALREADY_MINTED",
      "SHAPE72 collection already has an asset; Shape 01 mint is refused",
      409,
    );
  }

  const claimantKey = publicKey(claimant);
  const payer = createNoopSigner(claimantKey);
  const asset = generateSigner(umi);

  const builder = create(umi, {
    asset,
    name: SHAPE01_NAME,
    uri: metadataUri,
    owner: claimantKey,
    payer,
    authority: umi.identity,
    collection,
  }).setFeePayer(payer);

  const programs = [
    ...new Set(
      builder.items.map((item) => item.instruction.programId.toString()),
    ),
  ];
  const unexpected = programs.filter((id) => !ALLOWED_PROGRAMS.has(id));
  if (unexpected.length > 0) {
    throw new Shape01PrepareError(
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
    assetAddress: asset.publicKey.toString(),
    collectionAddress,
    metadataUri,
    imageUri,
    name: SHAPE01_NAME,
    feePayer: claimant,
    programs,
    applicationSolTransfer: 0,
  };
}

export async function readShape01Asset(assetAddress: string) {
  const umi = createOperatorUmi();
  return fetchAsset(umi, publicKey(assetAddress));
}
