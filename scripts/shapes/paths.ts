import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { optionalEnv } from "../lib/env";

export const SUGGESTED_ASSET_KEYPAIR_DIR = join(
  homedir(),
  ".config/solana/shape72/assets",
);

export function padShapeId(id: number): string {
  return String(id).padStart(2, "0");
}

export function shapeDisplayName(id: number): string {
  return `SHAPE ${padShapeId(id)}`;
}

export function assetKeypairDir(): string {
  return optionalEnv("SHAPE72_ASSET_KEYPAIR_DIR") || SUGGESTED_ASSET_KEYPAIR_DIR;
}

export function assetKeypairPath(id: number): string {
  return resolve(assetKeypairDir(), `shape-${padShapeId(id)}.json`);
}

export function ensureAssetKeypairDir(): string {
  const dir = assetKeypairDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  return dir;
}

export function localSvgPath(id: number): string {
  return resolve(process.cwd(), "public/shapes", `shape-${id}.svg`);
}

export function marketplacePngDir(): string {
  return resolve(process.cwd(), "public/shapes/marketplace");
}

export function marketplacePngPath(id: number): string {
  return resolve(marketplacePngDir(), `shape-${padShapeId(id)}.png`);
}

export function localMetadataPath(id: number): string {
  return resolve(process.cwd(), "metadata/shapes", `shape-${padShapeId(id)}.json`);
}

export function productionManifestPath(): string {
  return resolve(process.cwd(), "config/shapes.production.json");
}
