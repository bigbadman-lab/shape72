import production from "../../config/shapes.production.json";
import { padShapeId } from "@/data/shapes";

export type ShapeManifestEntry = {
  id: number;
  name: string;
  assetAddress: string;
  imageUri: string;
  svgUri?: string;
  metadataUri: string;
};

export const SHAPE_MANIFEST: ShapeManifestEntry[] = production as ShapeManifestEntry[];

export function manifestEntry(id: number): ShapeManifestEntry | undefined {
  return SHAPE_MANIFEST.find((entry) => entry.id === id);
}

export function requireManifestEntry(id: number): ShapeManifestEntry {
  const entry = manifestEntry(id);
  if (!entry) {
    throw new Error(`Shape ${padShapeId(id)} is missing from the production manifest`);
  }
  return entry;
}
