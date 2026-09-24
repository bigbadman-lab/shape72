import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadOperatorEnv, optionalEnv } from "../lib/env";
import { MARKETPLACE_PNG_SIZE } from "../shapes/metadata";
import { localMetadataPath, marketplacePngPath } from "../shapes/paths";
import { pinataUpload } from "../shapes/pinata";
import { SHAPE01_NAME, SHAPE01_SVG_URI } from "./marketplace-constants";

function pngSize(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG") {
    return { width: 0, height: 0 };
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function main() {
  loadOperatorEnv();
  if (optionalEnv("PINATA_JWT") === "") {
    throw new Error("BLOCKED — PINATA JWT REQUIRED");
  }

  const png = readFileSync(marketplacePngPath(1));
  const size = pngSize(png);
  if (size.width !== MARKETPLACE_PNG_SIZE || size.height !== MARKETPLACE_PNG_SIZE) {
    throw new Error(`Shape 01 PNG must be ${MARKETPLACE_PNG_SIZE}x${MARKETPLACE_PNG_SIZE}`);
  }

  const imageUri = await pinataUpload({
    bytes: png,
    filename: "shape-01.png",
    contentType: "image/png",
  });

  const metadata = {
    name: SHAPE01_NAME,
    symbol: "SHAPE72",
    description: "Shape 01 of 72. A 1/1 Genesis Shape from SHAPE72.",
    image: imageUri,
    attributes: [
      { trait_type: "Shape", value: "01" },
      { trait_type: "Edition", value: "1/1" },
      { trait_type: "Series", value: "Genesis 72" },
    ],
    properties: {
      files: [
        { uri: imageUri, type: "image/png" },
        { uri: SHAPE01_SVG_URI, type: "image/svg+xml" },
      ],
    },
  };

  const metadataPath = localMetadataPath(1);
  mkdirSync(dirname(metadataPath), { recursive: true });
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

  const metadataUri = await pinataUpload({
    bytes: Buffer.from(JSON.stringify(metadata)),
    filename: "shape-01.json",
    contentType: "application/json",
  });

  console.log(
    JSON.stringify(
      {
        SHAPE01_MARKETPLACE_PNG_URI: imageUri,
        SHAPE01_MARKETPLACE_METADATA_URI: metadataUri,
        svgUri: SHAPE01_SVG_URI,
        pngBytes: png.length,
        pngSize: size,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Shape 01 marketplace upload failed";
  console.error(message);
  process.exit(1);
});
