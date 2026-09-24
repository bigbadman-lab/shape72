import "server-only";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  createSignerFromKeypair,
  type Keypair,
  type Signer,
  type Umi,
} from "@metaplex-foundation/umi";
import { padShapeId } from "@/data/shapes";
import { requireManifestEntry } from "@/data/manifest";
import { EXPECTED_OPERATOR } from "@/server/constants";
import { serverEnv } from "@/server/env";

export type SignerBackend = "production-secret" | "local-filesystem";

function decodeSecretKeyB64(value: string, label: string): Uint8Array {
  const bytes = Buffer.from(value, "base64");
  if (bytes.length < 64) {
    throw new Error(`${label} is not a valid Ed25519 secret`);
  }
  return Uint8Array.from(bytes.subarray(0, 64));
}

function parseJsonSecretArray(raw: unknown, label: string): Uint8Array {
  if (!Array.isArray(raw) || raw.length < 64) {
    throw new Error(`${label} is not a valid Solana JSON secret`);
  }
  return Uint8Array.from(raw.slice(0, 64));
}

function hasProductionSecrets(): boolean {
  return Boolean(
    serverEnv("SHAPE72_OPERATOR_SECRET_KEY_B64") && serverEnv("SHAPE72_ASSET_SIGNERS_B64"),
  );
}

function hasFilesystemSecrets(): boolean {
  return Boolean(serverEnv("SHAPE72_OPERATOR_KEYPAIR_PATH") && serverEnv("SHAPE72_ASSET_KEYPAIR_DIR"));
}

export function signerBackend(): SignerBackend {
  if (hasProductionSecrets()) return "production-secret";
  if (hasFilesystemSecrets()) return "local-filesystem";
  throw new Error("No complete signer backend is configured");
}

function operatorSecretBytes(): Uint8Array {
  const backend = signerBackend();
  if (backend === "production-secret") {
    return decodeSecretKeyB64(serverEnv("SHAPE72_OPERATOR_SECRET_KEY_B64"), "operator secret");
  }
  const raw = JSON.parse(readFileSync(resolve(serverEnv("SHAPE72_OPERATOR_KEYPAIR_PATH")), "utf8"));
  return parseJsonSecretArray(raw, "operator keypair file");
}

function assetSecretBytes(id: number): Uint8Array {
  if (id === 1) {
    throw new Error("Shape 01 already exists and has no replacement asset signer");
  }
  const backend = signerBackend();
  if (backend === "production-secret") {
    const decoded = Buffer.from(serverEnv("SHAPE72_ASSET_SIGNERS_B64"), "base64").toString("utf8");
    const blob = JSON.parse(decoded) as Record<string, string>;
    const value = blob[String(id)];
    if (!value) {
      throw new Error(`Asset signer for Shape ${padShapeId(id)} is missing`);
    }
    return decodeSecretKeyB64(value, `Shape ${padShapeId(id)} secret`);
  }
  const file = resolve(join(serverEnv("SHAPE72_ASSET_KEYPAIR_DIR"), `shape-${padShapeId(id)}.json`));
  const raw = JSON.parse(readFileSync(file, "utf8"));
  return parseJsonSecretArray(raw, `Shape ${padShapeId(id)} keypair file`);
}

function signerFromSecret(umi: Umi, secret: Uint8Array): Signer {
  const keypair: Keypair = umi.eddsa.createKeypairFromSecretKey(secret);
  return createSignerFromKeypair(umi, keypair);
}

export function loadOperatorSigner(umi: Umi): Signer {
  const signer = signerFromSecret(umi, operatorSecretBytes());
  if (signer.publicKey.toString() !== EXPECTED_OPERATOR) {
    throw new Error("Operator signer public key mismatch");
  }
  return signer;
}

export function loadAssetSigner(umi: Umi, id: number): Signer {
  const expected = requireManifestEntry(id).assetAddress;
  const signer = signerFromSecret(umi, assetSecretBytes(id));
  if (signer.publicKey.toString() !== expected) {
    throw new Error(`Shape ${padShapeId(id)} signer does not match the production manifest`);
  }
  return signer;
}

export function inspectSignerHealth(umi: Umi): {
  operatorPresent: boolean;
  assetSignerCount: number;
  allManifestMatches: boolean;
} {
  loadOperatorSigner(umi);
  let assetSignerCount = 0;
  for (let id = 2; id <= 72; id += 1) {
    loadAssetSigner(umi, id);
    assetSignerCount += 1;
  }
  return {
    operatorPresent: true,
    assetSignerCount,
    allManifestMatches: assetSignerCount === 71,
  };
}
