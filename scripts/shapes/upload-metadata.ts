import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadOperatorEnv, optionalEnv } from "../lib/env";
import { shapeMetadataJson } from "./metadata";
import {
  localMetadataPath,
  localSvgPath,
  padShapeId,
  productionManifestPath,
  shapeDisplayName,
} from "./paths";
import { pinataUpload } from "./pinata";
import { Keypair } from "@solana/web3.js";
import { assetKeypairPath } from "./paths";

type ManifestEntry = {
  id: number;
  name: string;
  assetAddress: string;
  imageUri: string;
  metadataUri: string;
};

function readManifest(): ManifestEntry[] {
  return JSON.parse(readFileSync(productionManifestPath(), "utf8")) as ManifestEntry[];
}

function writeManifest(entries: ManifestEntry[]) {
  entries.sort((a, b) => a.id - b.id);
  writeFileSync(productionManifestPath(), `${JSON.stringify(entries, null, 2)}\n`);
}

function assetAddressFor(id: number, existing?: ManifestEntry): string {
  if (existing?.assetAddress) return existing.assetAddress;
  const raw = JSON.parse(readFileSync(assetKeypairPath(id), "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw)).publicKey.toBase58();
}

async function main() {
  loadOperatorEnv();
  if (optionalEnv("PINATA_JWT") === "") {
    throw new Error("BLOCKED — PINATA JWT REQUIRED");
  }

  const force = optionalEnv("SHAPE72_FORCE_METADATA_UPLOAD") === "YES";
  const manifest = readManifest();
  const byId = new Map(manifest.map((entry) => [entry.id, entry]));

  if (!byId.has(1)) {
    throw new Error("Shape 01 must already exist in the production manifest");
  }

  for (let id = 2; id <= 72; id += 1) {
    const current = byId.get(id);
    if (current?.imageUri && current.metadataUri && !force) {
      console.log(`skip ${padShapeId(id)}`);
      continue;
    }

    const svg = readFileSync(localSvgPath(id));
    const imageUri = await pinataUpload({
      bytes: svg,
      filename: `shape-${id}.svg`,
      contentType: "image/svg+xml",
    });
    const metadata = shapeMetadataJson(id, imageUri);
    const metadataPath = localMetadataPath(id);
    mkdirSync(dirname(metadataPath), { recursive: true });
    writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
    const metadataUri = await pinataUpload({
      bytes: Buffer.from(JSON.stringify(metadata)),
      filename: `shape-${padShapeId(id)}.json`,
      contentType: "application/json",
    });

    byId.set(id, {
      id,
      name: shapeDisplayName(id),
      assetAddress: assetAddressFor(id, current),
      imageUri,
      metadataUri,
    });
    writeManifest([...byId.values()]);
    console.log(`uploaded ${padShapeId(id)}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Metadata upload failed";
  console.error(message);
  process.exit(1);
});
