import { padShapeId, shapeDisplayName } from "./paths";

export const MARKETPLACE_PNG_SIZE = 1200;
export const MARKETPLACE_ORANGE = "#FF5C00";
export const MARKETPLACE_BACKGROUND = "#080808";

export function shapeMetadataJson(id: number, imageUri: string, svgUri?: string) {
  const padded = padShapeId(id);
  const files = svgUri
    ? [
        { uri: imageUri, type: "image/png" },
        { uri: svgUri, type: "image/svg+xml" },
      ]
    : [{ uri: imageUri, type: "image/svg+xml" }];

  return {
    name: shapeDisplayName(id),
    symbol: "SHAPE72",
    description: `Shape ${padded} of 72. A 1/1 Genesis Shape from SHAPE72.`,
    image: imageUri,
    attributes: [
      { trait_type: "Shape", value: padded },
      { trait_type: "Edition", value: "1/1" },
      { trait_type: "Series", value: "Genesis 72" },
    ],
    properties: {
      category: "image",
      files,
    },
  };
}
