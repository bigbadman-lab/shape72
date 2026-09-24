import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { get } from "@vercel/global-config";
import {
  INACTIVE_TOKEN,
  TOKEN_CONFIG_KEY,
  type TokenRuntimeConfig,
  parseTokenConfig,
} from "@/data/token";
import { serverEnv } from "@/server/env";

export const TOKEN_FIXTURE_PATH = resolve(process.cwd(), ".local/token-fixture.json");

function fixtureAllowed(): boolean {
  return serverEnv("VERCEL_ENV") !== "production";
}

function readFixture(): TokenRuntimeConfig | null {
  if (!fixtureAllowed() || !existsSync(TOKEN_FIXTURE_PATH)) return null;
  try {
    return parseTokenConfig(JSON.parse(readFileSync(TOKEN_FIXTURE_PATH, "utf8")));
  } catch {
    return null;
  }
}

async function readGlobalConfigToken(): Promise<TokenRuntimeConfig | null> {
  if (!serverEnv("GLOBAL_CONFIG") && !serverEnv("EDGE_CONFIG")) return null;
  try {
    const value = await get(TOKEN_CONFIG_KEY);
    return parseTokenConfig(value);
  } catch {
    return null;
  }
}

export async function readTokenRuntime(): Promise<TokenRuntimeConfig> {
  const fixture = readFixture();
  if (fixture) return fixture;
  const hosted = await readGlobalConfigToken();
  return hosted || { ...INACTIVE_TOKEN };
}

export function tokenSourceLabel(): "fixture" | "global-config" | "inactive" {
  if (fixtureAllowed() && existsSync(TOKEN_FIXTURE_PATH)) return "fixture";
  if (serverEnv("GLOBAL_CONFIG") || serverEnv("EDGE_CONFIG")) return "global-config";
  return "inactive";
}
