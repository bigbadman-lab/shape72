import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Keypair } from "@solana/web3.js";
import { loadOperatorEnv, requiredEnv } from "../lib/env";
import { assetKeypairPath, padShapeId, productionManifestPath } from "../shapes/paths";

const EXPECTED_OPERATOR = "G1j79DPv71wGSxunG75aoqwuX3kwCguncU2mHA9GJF2z";
const OUTPUT = resolve(process.cwd(), ".local/production-signers.env");

type ManifestEntry = { id: number; assetAddress: string };

function loadSecret(path: string, label: string): Keypair {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  if (!Array.isArray(raw) || raw.length < 64) {
    throw new Error(`${label} is not a valid Solana JSON secret`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function main() {
  loadOperatorEnv();
  const operator = loadSecret(requiredEnv("SHAPE72_OPERATOR_KEYPAIR_PATH"), "operator");
  const manifest = JSON.parse(readFileSync(productionManifestPath(), "utf8")) as ManifestEntry[];
  const assets: Record<string, string> = {};
  let matches = 0;
  const mismatches: string[] = [];
  const seen = new Set<string>();

  if (operator.publicKey.toBase58() !== EXPECTED_OPERATOR) {
    throw new Error("Operator signer public key mismatch");
  }

  for (let id = 2; id <= 72; id += 1) {
    const keypair = loadSecret(assetKeypairPath(id), `Shape ${padShapeId(id)}`);
    const address = keypair.publicKey.toBase58();
    if (seen.has(address)) {
      throw new Error(`Duplicate asset signer at Shape ${padShapeId(id)}`);
    }
    seen.add(address);
    const entry = manifest.find((item) => item.id === id);
    if (!entry || entry.assetAddress !== address) {
      mismatches.push(padShapeId(id));
    } else {
      matches += 1;
    }
    assets[String(id)] = Buffer.from(keypair.secretKey).toString("base64");
  }

  if (manifest.some((entry) => entry.id === 1 && assets["1"])) {
    throw new Error("Shape 01 signer must not be exported");
  }
  if (matches !== 71 || mismatches.length > 0) {
    throw new Error(`Manifest mismatches: ${mismatches.join(", ") || "count"}`);
  }

  const operatorB64 = Buffer.from(operator.secretKey).toString("base64");
  const assetsB64 = Buffer.from(JSON.stringify(assets)).toString("base64");
  mkdirSync(dirname(OUTPUT), { recursive: true, mode: 0o700 });
  writeFileSync(
    OUTPUT,
    [
      `SHAPE72_OPERATOR_SECRET_KEY_B64=${operatorB64}`,
      `SHAPE72_ASSET_SIGNERS_B64=${assetsB64}`,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );

  console.log(
    [
      "operator signer: MATCH",
      `asset signers: ${matches} / 71 MATCH`,
      "manifest mismatches: 0",
      `operator secret bytes: ${operatorB64.length}`,
      `asset blob bytes: ${assetsB64.length}`,
      "artifact: .local/production-signers.env",
    ].join("\n"),
  );
  if (assetsB64.length > 60_000) {
    throw new Error("BLOCKED — ASSET SIGNER BLOB EXCEEDS SAFE VERCEL ENV SIZE");
  }
}

main();
