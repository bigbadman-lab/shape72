import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadOperatorEnv, optionalEnv } from "../lib/env";
import { INACTIVE_TOKEN, parseTokenConfig } from "../../src/data/token";
import { TEST_PUMP_MINT } from "./constants";
import { hasGlobalConfigCredentials, readProductionToken } from "./global-config";

const FIXTURE_PATH = resolve(process.cwd(), ".local/token-fixture.json");

async function getTokenApi() {
  const appUrl = optionalEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
  const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/token`, {
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`token API HTTP ${response.status}`);
  }
  return parseTokenConfig(await response.json());
}

function writeFixture(mint: string) {
  mkdirSync(dirname(FIXTURE_PATH), { recursive: true });
  writeFileSync(
    FIXTURE_PATH,
    `${JSON.stringify(
      {
        active: true,
        symbol: "72",
        mint,
        network: "solana-mainnet",
        launchPlatform: "pump.fun",
        activatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
}

function removeFixture() {
  try {
    unlinkSync(FIXTURE_PATH);
  } catch {
    // already gone
  }
}

async function main() {
  loadOperatorEnv();
  const before = await getTokenApi();
  if (before.active) {
    throw new Error("Rehearsal requires a prelaunch token API");
  }

  writeFixture(TEST_PUMP_MINT);
  const active = await getTokenApi();
  if (!active.active || active.mint !== TEST_PUMP_MINT) {
    removeFixture();
    throw new Error("Fixture activation did not reach the token API");
  }

  removeFixture();
  const after = await getTokenApi();
  if (after.active) {
    throw new Error("Fixture removal did not restore prelaunch");
  }

  const production = hasGlobalConfigCredentials()
    ? await readProductionToken()
    : { ...INACTIVE_TOKEN };
  if (production.active) {
    throw new Error("Production shape72Token became active during rehearsal");
  }

  console.log(
    [
      "inactive config → PRELAUNCH",
      "test activation fixture → active fixture",
      "token API switched states",
      "test fixture removed → PRELAUNCH",
      "production shape72Token remains inactive",
      "",
      "PASS — RUNTIME PROPAGATION REHEARSAL",
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  removeFixture();
  const message = error instanceof Error ? error.message : "Token rehearsal failed";
  console.error(message);
  process.exit(1);
});
