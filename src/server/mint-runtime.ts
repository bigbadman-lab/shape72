import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { get } from "@vercel/global-config";
import { parseMintConfig, MINT_CONFIG_KEY } from "@/data/mint";
import { isLocalMintEnvEnabled, serverEnv } from "@/server/env";

export const MINT_FIXTURE_PATH = resolve(process.cwd(), ".local/mint-fixture.json");

function fixtureAllowed(): boolean {
  return serverEnv("VERCEL_ENV") !== "production";
}

function readFixtureEnabled(): boolean | null {
  if (!fixtureAllowed() || !existsSync(MINT_FIXTURE_PATH)) return null;
  try {
    return parseMintConfig(JSON.parse(readFileSync(MINT_FIXTURE_PATH, "utf8"))).enabled;
  } catch {
    return false;
  }
}

function hasGlobalConfigConnection(): boolean {
  return Boolean(serverEnv("GLOBAL_CONFIG") || serverEnv("EDGE_CONFIG"));
}

function isProduction(): boolean {
  return serverEnv("VERCEL_ENV") === "production";
}

export async function isPublicMintEnabled(): Promise<boolean> {
  const fixture = readFixtureEnabled();
  if (fixture !== null) return fixture === true;

  if (isProduction() || hasGlobalConfigConnection()) {
    try {
      const value = await get(MINT_CONFIG_KEY);
      return parseMintConfig(value).enabled === true;
    } catch {
      return false;
    }
  }

  return isLocalMintEnvEnabled();
}
