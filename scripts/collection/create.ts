import { createCollection, fetchCollection } from "@metaplex-foundation/mpl-core";
import { generateSigner, publicKey } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { loadOperatorEnv, optionalEnv } from "../lib/env";
import {
  COLLECTION_DESCRIPTION,
  COLLECTION_IMAGE_FILE,
  COLLECTION_NAME,
  CONFIRM_CREATE,
  FORCE_NEW_COLLECTION,
  MIN_OPERATOR_SOL,
} from "./constants";
import { assertMainnetRpc } from "./rpc";
import { createOperatorUmi, lamportsToSol } from "./umi";

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

async function main() {
  loadOperatorEnv();
  await assertMainnetRpc();

  const keypairPath = optionalEnv("SHAPE72_OPERATOR_KEYPAIR_PATH");
  const metadataUri = optionalEnv("SHAPE72_COLLECTION_METADATA_URI");
  const imageUri = optionalEnv("SHAPE72_COLLECTION_IMAGE_URI");
  const existing = optionalEnv("SHAPE72_COLLECTION_ADDRESS");
  const confirm = optionalEnv("SHAPE72_CONFIRM_MAINNET_CREATE");
  const forceNew = optionalEnv("SHAPE72_FORCE_NEW_COLLECTION");

  let operator: string | null = null;
  let sol: number | null = null;
  let umi = null as ReturnType<typeof createOperatorUmi> | null;

  if (keypairPath) {
    umi = createOperatorUmi(keypairPath);
    operator = umi.identity.publicKey.toString();
    const balance = await umi.rpc.getBalance(umi.identity.publicKey);
    sol = lamportsToSol(balance.basisPoints);
  }

  const durableMetadata = isDurableUri(metadataUri);
  const durableImage = isDurableUri(imageUri);

  console.log(
    JSON.stringify(
      {
        stage: "preflight",
        network: "solana-mainnet",
        rpcConfigured: true,
        operatorKeypairPath: keypairPath ? "present" : "missing",
        operatorPublicKey: operator,
        operatorSol: sol,
        collectionName: COLLECTION_NAME,
        description: COLLECTION_DESCRIPTION,
        imageAsset: COLLECTION_IMAGE_FILE,
        imageUri: imageUri || null,
        metadataUri: metadataUri || null,
        existingCollection: existing || null,
        confirmMainnetCreate: confirm === CONFIRM_CREATE,
        checks: {
          operatorKeypair: Boolean(keypairPath),
          durableMetadataUri: durableMetadata,
          durableImageUri: durableImage,
          sufficientSol: sol === null ? false : sol >= MIN_OPERATOR_SOL,
        },
      },
      null,
      2,
    ),
  );

  if (!keypairPath) {
    throw new Error(
      "SHAPE72_OPERATOR_KEYPAIR_PATH is missing. Set it to the operator JSON keypair. The default Solana CLI keypair is not used unless that path is set explicitly.",
    );
  }

  if (sol !== null && sol < MIN_OPERATOR_SOL) {
    throw new Error("Operator SOL balance is insufficient for collection creation");
  }

  if (!umi) {
    throw new Error("Operator Umi client was not initialized");
  }

  if (existing && forceNew !== FORCE_NEW_COLLECTION) {
    const collection = await fetchCollection(umi, publicKey(existing));
    console.log(
      JSON.stringify(
        {
          stage: "idempotent-skip",
          collectionAddress: existing,
          name: collection.name,
          uri: collection.uri,
          updateAuthority: collection.updateAuthority.toString(),
          numMinted: collection.numMinted,
          note: "SHAPE72_COLLECTION_ADDRESS is already set. Refusing to create another collection.",
        },
        null,
        2,
      ),
    );
    return;
  }

  if (!durableMetadata) {
    throw new Error(
      "BLOCKED — COLLECTION METADATA URI REQUIRED. Set SHAPE72_COLLECTION_METADATA_URI to a durable https URI (IPFS/Arweave/Irys). Do not use localhost or preview URLs.",
    );
  }

  if (confirm !== CONFIRM_CREATE) {
    console.log(
      JSON.stringify(
        {
          stage: "ready",
          verdict: "READY FOR MAINNET COLLECTION CREATE",
          next: "Re-run with SHAPE72_CONFIRM_MAINNET_CREATE=YES to broadcast exactly one production collection transaction.",
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  console.log(
    "About to create the production SHAPE72 Core Collection on Solana Mainnet.",
  );

  const collectionSigner = generateSigner(umi);
  const result = await createCollection(umi, {
    collection: collectionSigner,
    name: COLLECTION_NAME,
    uri: metadataUri,
    updateAuthority: umi.identity.publicKey,
  }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });

  const signature = base58.deserialize(result.signature)[0];
  const collectionAddress = collectionSigner.publicKey.toString();
  const fetched = await fetchCollection(umi, collectionSigner.publicKey);

  const verification = {
    name: fetched.name === COLLECTION_NAME,
    uri: fetched.uri === metadataUri,
    updateAuthority: fetched.updateAuthority.toString() === operator,
    noAssets: fetched.numMinted === 0,
  };

  console.log(
    JSON.stringify(
      {
        stage: "created",
        collectionAddress,
        transactionSignature: signature,
        confirmation: "confirmed",
        name: fetched.name,
        uri: fetched.uri,
        updateAuthority: fetched.updateAuthority.toString(),
        numMinted: fetched.numMinted,
        verification,
        configure: `Set SHAPE72_COLLECTION_ADDRESS=${collectionAddress} in .env.local`,
      },
      null,
      2,
    ),
  );

  if (Object.values(verification).some((ok) => !ok)) {
    throw new Error("Collection created but on-chain verification failed");
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Collection create failed";
  console.error(message);
  process.exit(1);
});
