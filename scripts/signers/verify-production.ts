import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Keypair } from "@solana/web3.js";
import { loadOperatorEnv, optionalEnv } from "../lib/env";
import { padShapeId, productionManifestPath } from "../shapes/paths";

const EXPECTED_OPERATOR = "G1j79DPv71wGSxunG75aoqwuX3kwCguncU2mHA9GJF2z";
const ARTIFACT = resolve(process.cwd(), ".local/production-signers.env");

type ManifestEntry = { id: number; assetAddress: string };

function loadArtifact(): Record<string, string> {
  if (!existsSync(ARTIFACT)) return {};
  const out: Record<string, string> = {};
  for (const rawLine of readFileSync(ARTIFACT, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const eq = line.indexOf("=");
    out[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return out;
}

function secret(name: string, artifact: Record<string, string>): string {
  return optionalEnv(name) || artifact[name] || "";
}

function keypairFromB64(value: string, label: string): Keypair {
  const bytes = Buffer.from(value, "base64");
  if (bytes.length < 64) {
    throw new Error(`${label} is not a valid Ed25519 secret`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(bytes.subarray(0, 64)));
}

function main() {
  loadOperatorEnv();
  const artifact = loadArtifact();
  const operatorB64 = secret("SHAPE72_OPERATOR_SECRET_KEY_B64", artifact);
  const assetsB64 = secret("SHAPE72_ASSET_SIGNERS_B64", artifact);
  if (!operatorB64 || !assetsB64) {
    throw new Error("Production signer secrets are missing");
  }

  const operator = keypairFromB64(operatorB64, "operator");
  if (operator.publicKey.toBase58() !== EXPECTED_OPERATOR) {
    throw new Error("operator signer public key mismatch");
  }

  const blob = JSON.parse(Buffer.from(assetsB64, "base64").toString("utf8")) as Record<
    string,
    string
  >;
  if (blob["1"]) {
    throw new Error("unexpected Shape 01 signer");
  }

  const manifest = JSON.parse(readFileSync(productionManifestPath(), "utf8")) as ManifestEntry[];
  const seen = new Set<string>();
  let matches = 0;
  let missing = 0;
  for (let id = 2; id <= 72; id += 1) {
    const value = blob[String(id)];
    if (!value) {
      missing += 1;
      continue;
    }
    const keypair = keypairFromB64(value, `Shape ${padShapeId(id)}`);
    const address = keypair.publicKey.toBase58();
    if (seen.has(address)) {
      throw new Error(`duplicate signer address at Shape ${padShapeId(id)}`);
    }
    seen.add(address);
    const entry = manifest.find((item) => item.id === id);
    if (entry?.assetAddress === address) matches += 1;
  }

  console.log(
    [
      `operator signer public key = ${EXPECTED_OPERATOR}`,
      `Shape 02 signer = ${manifest.find((item) => item.id === 2)?.assetAddress}`,
      `Shape 72 signer = ${manifest.find((item) => item.id === 72)?.assetAddress}`,
      "",
      `${matches} / 71 asset signers MATCH`,
      "operator MATCH",
      `duplicate signer addresses = ${seen.size === matches ? 0 : "FAIL"}`,
      `missing signers = ${missing}`,
      `unexpected Shape 01 signer = ${blob["1"] ? 1 : 0}`,
    ].join("\n"),
  );
  if (matches !== 71 || missing !== 0 || seen.size !== 71) {
    throw new Error("Production signer verification failed");
  }
}

main();
