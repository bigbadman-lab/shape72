import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { loadOperatorEnv, optionalEnv } from "../lib/env";
import { shapeMetadataJson } from "./metadata";
import { localSvgPath, padShapeId, productionManifestPath } from "./paths";

type ManifestEntry = {
  id: number;
  name: string;
  imageUri: string;
  metadataUri: string;
};

type PinataFile = {
  cid?: string;
  name?: string;
  mime_type?: string;
  size?: number;
};

function cidFrom(uri: string): string | null {
  const ipfs = uri.match(/ipfs:\/\/([^/?#]+)/i);
  if (ipfs) return ipfs[1];
  const gw = uri.match(/\/ipfs\/([^/?#]+)/i);
  return gw ? gw[1] : null;
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

function attr(
  hosted: ReturnType<typeof shapeMetadataJson>,
  trait: string,
): string {
  return hosted.attributes.find((item) => item.trait_type === trait)?.value || "";
}

async function pinataFile(cid: string): Promise<PinataFile | null> {
  const jwt = optionalEnv("PINATA_JWT");
  if (!jwt) return null;
  const response = await fetch(
    `https://api.pinata.cloud/v3/files/public?cid=${encodeURIComponent(cid)}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  if (!response.ok) return null;
  const json = (await response.json()) as { data?: { files?: PinataFile[] } };
  return json.data?.files?.[0] || null;
}

async function main() {
  loadOperatorEnv();
  const manifest = JSON.parse(readFileSync(productionManifestPath(), "utf8")) as ManifestEntry[];
  let imageOk = 0;
  let metadataOk = 0;
  let hashOk = 0;
  const failures: string[] = [];

  for (const entry of manifest) {
    const imageCid = cidFrom(entry.imageUri);
    const metadataCid = cidFrom(entry.metadataUri);
    const local = readFileSync(localSvgPath(entry.id));
    const imageCidMatch = Boolean(imageCid && cidV1Raw(local) === imageCid);
    const hostedImage = imageCid ? await pinataFile(imageCid) : null;
    const imageValid = Boolean(
      imageCidMatch &&
        hostedImage &&
        hostedImage.cid === imageCid &&
        hostedImage.mime_type === "image/svg+xml" &&
        hostedImage.size === local.length,
    );

    const expected = shapeMetadataJson(entry.id, entry.imageUri);
    const encoded = Buffer.from(JSON.stringify(expected));
    const metadataCidMatch = Boolean(metadataCid && cidV1Raw(encoded) === metadataCid);
    const hostedMeta = metadataCid ? await pinataFile(metadataCid) : null;
    const fieldsValid = Boolean(
      expected.name === entry.name &&
        expected.image === entry.imageUri &&
        expected.properties.files[0]?.uri === entry.imageUri &&
        expected.properties.files[0]?.type === "image/svg+xml" &&
        attr(expected, "Series") === "Genesis 72" &&
        attr(expected, "Edition") === "1/1" &&
        attr(expected, "Shape") === padShapeId(entry.id),
    );
    const metaValid = Boolean(
      hostedMeta &&
        hostedMeta.cid === metadataCid &&
        /json/i.test(hostedMeta.mime_type || "") &&
        (entry.id === 1 ? fieldsValid : metadataCidMatch && fieldsValid),
    );

    if (imageValid) imageOk += 1;
    if (metaValid) metadataOk += 1;
    if (imageCidMatch) hashOk += 1;
    if (!imageValid || !metaValid) failures.push(padShapeId(entry.id));
  }

  console.log(
    [
      `${manifest.length} / 72 manifest entries`,
      `${imageOk} / 72 image URIs valid`,
      `${metadataOk} / 72 metadata URIs valid`,
      `${hashOk} / 72 SVG hashes match`,
    ].join("\n"),
  );
  if (failures.length > 0) {
    throw new Error(`Metadata verification failed for ${failures.join(", ")}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Metadata verification failed";
  console.error(message);
  process.exit(1);
});
