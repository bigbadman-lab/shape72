import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadOperatorEnv, optionalEnv } from "../lib/env";
import { shapeMetadataJson } from "./metadata";
import {
  localMetadataPath,
  marketplacePngPath,
  padShapeId,
  productionManifestPath,
  shapeDisplayName,
} from "./paths";
import { pinataUpload } from "./pinata";

type ManifestEntry = {
  id: number;
  name: string;
  assetAddress: string;
  imageUri: string;
  svgUri?: string;
  metadataUri: string;
};

function readManifest(): ManifestEntry[] {
  return JSON.parse(readFileSync(productionManifestPath(), "utf8")) as ManifestEntry[];
}

function writeManifest(entries: ManifestEntry[]) {
  entries.sort((a, b) => a.id - b.id);
  writeFileSync(productionManifestPath(), `${JSON.stringify(entries, null, 2)}\n`);
}

async function main() {
  loadOperatorEnv();
  if (optionalEnv("PINATA_JWT") === "") {
    throw new Error("BLOCKED — PINATA JWT REQUIRED");
  }

  const force = optionalEnv("SHAPE72_FORCE_MARKETPLACE_UPLOAD") === "YES";
  const manifest = readManifest();
  const byId = new Map(manifest.map((entry) => [entry.id, entry]));

  for (let id = 2; id <= 72; id += 1) {
    const current = byId.get(id);
    if (!current?.assetAddress) {
      throw new Error(`Shape ${padShapeId(id)} is missing from the production manifest`);
    }
    const svgUri = current.svgUri || current.imageUri;
    const alreadyMarketplace = Boolean(
      current.svgUri &&
        current.imageUri &&
        current.imageUri !== current.svgUri &&
        current.metadataUri,
    );
    if (alreadyMarketplace && !force) {
      console.log(`skip ${padShapeId(id)}`);
      continue;
    }

    const png = readFileSync(marketplacePngPath(id));
    const imageUri = await pinataUpload({
      bytes: png,
      filename: `shape-${padShapeId(id)}.png`,
      contentType: "image/png",
    });
    const metadata = shapeMetadataJson(id, imageUri, svgUri);
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
      assetAddress: current.assetAddress,
      imageUri,
      svgUri,
      metadataUri,
    });
    writeManifest([...byId.values()]);
    console.log(`marketplace ${padShapeId(id)}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Marketplace metadata upload failed";
  console.error(message);
  process.exit(1);
});
