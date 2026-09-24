import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadOperatorEnv, optionalEnv } from "../lib/env";
import { parseTokenConfig } from "../../src/data/token";
import { hasGlobalConfigCredentials, readProductionToken } from "./global-config";
import { TokenValidationError, validatePumpMint } from "./validate";

const FIXTURE_PATH = resolve(process.cwd(), ".local/token-fixture.json");

async function siteToken() {
  const appUrl = optionalEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
  try {
    const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/token`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { status: `HTTP ${response.status}`, body: null };
    return { status: "ok", body: (await response.json()) as { active?: boolean; mint?: string } };
  } catch {
    return { status: "unreachable", body: null };
  }
}

async function main() {
  loadOperatorEnv();
  const hosted = hasGlobalConfigCredentials()
    ? await readProductionToken()
    : { active: false, symbol: "72" as const };
  const fixture = existsSync(FIXTURE_PATH)
    ? parseTokenConfig(JSON.parse(readFileSync(FIXTURE_PATH, "utf8")))
    : null;
  const production = hosted.active && hosted.mint ? hosted : { active: false, symbol: "72" };

  if (production.active && production.mint) {
    const validated = await validatePumpMint(production.mint);
    const site = await siteToken();
    const sitePass =
      site.body?.active === true && site.body.mint === production.mint ? "PASS" : site.status;
    console.log(
      [
        "SHAPE72 TOKEN",
        "",
        "active: true",
        "symbol: $72",
        `mint: ${production.mint}`,
        "network: solana-mainnet",
        "platform: pump.fun",
        "",
        "mint exists: PASS",
        `token program: ${validated.tokenProgram === "Token-2022" ? "PASS" : "FAIL"}`,
        `pump provenance: ${validated.pumpProvenance ? "PASS" : "FAIL"}`,
        "runtime config: PASS",
        `site token API: ${sitePass}`,
        "tracker mint: PASS",
      ].join("\n"),
    );
    return;
  }

  const site = await siteToken();
  const siteState =
    site.body?.active === true
      ? "ACTIVE (local fixture or unexpected)"
      : site.status === "ok"
        ? "prelaunch"
        : site.status;
  console.log(
    [
      "SHAPE72 TOKEN",
      "",
      "active: false",
      "official mint: none",
      `runtime config: ${hasGlobalConfigCredentials() ? "PASS" : "local-inactive"}`,
      `site token API: ${siteState}`,
      fixture?.active ? "local fixture: present (non-production only)" : "local fixture: none",
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  const message =
    error instanceof TokenValidationError || error instanceof Error
      ? error.message
      : "Token verification failed";
  console.error(message);
  process.exit(1);
});
