/**
 * Gate 4+ Shape NFT metadata contract.
 *
 * Deterministic mapping only. No uploads, no mints, no SVG edits.
 * `shape-{id}.svg` is Shape `id` — never reshuffled.
 */

export const SHAPE_METADATA_SERIES = "Genesis 72";
export const SHAPE_METADATA_COLLECTION = "SHAPE72";
export const SHAPE_METADATA_EDITION = "1/1";

export function shapeAssetFile(id: number): string {
  return `shape-${id}.svg`;
}

export function shapeDisplayName(id: number): string {
  return `SHAPE ${String(id).padStart(2, "0")}`;
}

export function shapeMetadataAttributes(id: number) {
  const padded = String(id).padStart(2, "0");
  return [
    { trait_type: "Shape", value: padded },
    { trait_type: "Edition", value: SHAPE_METADATA_EDITION },
    { trait_type: "Series", value: SHAPE_METADATA_SERIES },
  ];
}

export function proposedShapeMetadata(id: number) {
  return {
    name: shapeDisplayName(id),
    symbol: SHAPE_METADATA_COLLECTION,
    description: `${shapeDisplayName(id)} of ${SHAPE_METADATA_COLLECTION}. ${SHAPE_METADATA_EDITION}.`,
    image: shapeAssetFile(id),
    attributes: shapeMetadataAttributes(id),
    properties: {
      category: "image",
      files: [{ uri: shapeAssetFile(id), type: "image/svg+xml" }],
    },
    collection: { name: SHAPE_METADATA_COLLECTION },
  };
}
