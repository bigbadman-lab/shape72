import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { loadOperatorEnv, optionalEnv } from "../lib/env";
import { MARKETPLACE_PNG_SIZE, shapeMetadataJson } from "./metadata";
import {
  localSvgPath,
  marketplacePngPath,
  padShapeId,
  productionManifestPath,
} from "./paths";

type ManifestEntry = {
  id: number;
  name: string;
  imageUri: string;
  svgUri?: string;
  metadataUri: string;
};

type PinataFile = {
  cid?: string;
  mime_type?: string;
  size?: number;
};

function cidFrom(uri: string): string | null {
  const ipfs = uri.match(/ipfs:\/\/([^/?#]+)/i);
  return ipfs ? ipfs[1] : null;
}

function cidV1Raw(bytes: Uint8Array): string {
  const digest = createHash("sha256").update(bytes).digest();
  const cid = Buffer.concat([Buffer.from([0x01, 0x55, 0x12, 0x20]), digest]);
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let bits = 0;
  let value = 0;
  let out = "b";
  for (const byte of cid) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

function pngSize(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG") {
    return { width: 0, height: 0 };
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
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
  const manifest = JSON.parse(readFileSync(productionManifestPath(), "utf8")) as ManifestEntry[];
  const rows = manifest.filter((entry) => entry.id >= 1 && entry.id <= 72);
  let pngOk = 0;
  let svgOk = 0;
  let metaOk = 0;
  let imageRefOk = 0;
  const failures: string[] = [];

  for (const entry of rows) {
    const svgUri = entry.svgUri || "";
    const pngCid = cidFrom(entry.imageUri);
    const svgCid = cidFrom(svgUri);
    const metaCid = cidFrom(entry.metadataUri);
    const localSvg = readFileSync(localSvgPath(entry.id));
    const localPng = readFileSync(marketplacePngPath(entry.id));
    const size = pngSize(localPng);
    const hostedPng = pngCid ? await pinataFile(pngCid) : null;
    const hostedSvg = svgCid ? await pinataFile(svgCid) : null;
    const hostedMeta = metaCid ? await pinataFile(metaCid) : null;
    const expected =
      entry.id === 1
        ? {
            name: entry.name,
            symbol: "SHAPE72",
            description: "Shape 01 of 72. A 1/1 Genesis Shape from SHAPE72.",
            image: entry.imageUri,
            attributes: [
              { trait_type: "Shape", value: "01" },
              { trait_type: "Edition", value: "1/1" },
              { trait_type: "Series", value: "Genesis 72" },
            ],
            properties: {
              files: [
                { uri: entry.imageUri, type: "image/png" },
                { uri: svgUri, type: "image/svg+xml" },
              ],
            },
          }
        : shapeMetadataJson(entry.id, entry.imageUri, svgUri);
    const encoded = Buffer.from(JSON.stringify(expected));

    const pngValid = Boolean(
      pngCid &&
        cidV1Raw(localPng) === pngCid &&
        hostedPng?.mime_type === "image/png" &&
        size.width === MARKETPLACE_PNG_SIZE &&
        size.height === MARKETPLACE_PNG_SIZE,
    );
    const svgValid = Boolean(
      svgCid &&
        cidV1Raw(localSvg) === svgCid &&
        hostedSvg?.mime_type === "image/svg+xml" &&
        hostedSvg.size === localSvg.length,
    );
    const metaValid = Boolean(
      metaCid &&
        cidV1Raw(encoded) === metaCid &&
        hostedMeta &&
        /json/i.test(hostedMeta.mime_type || "") &&
        expected.name === entry.name &&
        expected.image === entry.imageUri &&
        expected.properties.files.some((file) => file.type === "image/png" && file.uri === entry.imageUri) &&
        expected.properties.files.some((file) => file.type === "image/svg+xml" && file.uri === svgUri) &&
        expected.attributes.find((item) => item.trait_type === "Edition")?.value === "1/1" &&
        expected.attributes.find((item) => item.trait_type === "Series")?.value === "Genesis 72" &&
        expected.attributes.find((item) => item.trait_type === "Shape")?.value === padShapeId(entry.id),
    );
    const imageRefValid = expected.image === entry.imageUri && Boolean(pngCid);

    if (pngValid) pngOk += 1;
    if (svgValid) svgOk += 1;
    if (metaValid) metaOk += 1;
    if (imageRefValid) imageRefOk += 1;
    if (!pngValid || !svgValid || !metaValid || !imageRefValid) {
      failures.push(padShapeId(entry.id));
    }
  }

  console.log(
    [
      `${pngOk} / 72 marketplace PNGs valid`,
      `${svgOk} / 72 SVG source files preserved`,
      `${metaOk} / 72 metadata JSON valid`,
      `${imageRefOk} / 72 PNG primary image references valid`,
    ].join("\n"),
  );
  if (failures.length > 0) {
    throw new Error(`Marketplace metadata verification failed for ${failures.join(", ")}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Marketplace metadata verification failed";
  console.error(message);
  process.exit(1);
});
