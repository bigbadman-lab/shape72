import { padShapeId, shapeDisplayName } from "./paths";

export function shapeMetadataJson(id: number, imageUri: string) {
  const padded = padShapeId(id);
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
      files: [
        {
          uri: imageUri,
          type: "image/svg+xml",
        },
      ],
    },
  };
}
