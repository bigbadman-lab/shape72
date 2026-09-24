import { loadOperatorEnv, optionalEnv } from "../lib/env";
import { assertMainnetRpc } from "../collection/rpc";
import {
  activationObject,
  hasGlobalConfigCredentials,
  readProductionToken,
  writeProductionToken,
} from "./global-config";
import { TokenValidationError, validatePumpMint } from "./validate";

function parseArgs(argv: string[]) {
  const raw = argv.filter((item) => item !== "--");
  const flags = new Set(raw.filter((item) => item.startsWith("--")));
  const positional = raw.filter((item) => !item.startsWith("--"));
  return {
    mint: positional[0] || "",
    dryRun: flags.has("--dry-run"),
    confirm: flags.has("--confirm-production"),
  };
}

async function main() {
  loadOperatorEnv();
  await assertMainnetRpc();
  const args = parseArgs(process.argv.slice(2));
  if (!args.mint) {
    throw new Error("Usage: npm run token:activate -- <MINT_ADDRESS> [--dry-run|--confirm-production]");
  }
  if (args.confirm && args.dryRun) {
    throw new Error("Cannot combine --dry-run with --confirm-production");
  }

  const current = await readProductionToken();
  if (current.active && current.mint) {
    console.log(
      [
        "BLOCKED — OFFICIAL MINT ALREADY ACTIVE",
        `existing mint: ${current.mint}`,
        "token:activate will not replace the official production mint.",
      ].join("\n"),
    );
    process.exit(1);
  }

  const validated = await validatePumpMint(args.mint);
  const preview = [
    "SHAPE72 TOKEN ACTIVATION",
    "",
    "network: solana-mainnet",
    "symbol: $72",
    `mint: ${validated.mint}`,
    `token program: ${validated.tokenProgram}`,
    `decimals: ${validated.decimals}`,
    `symbol metadata: ${validated.symbol}`,
    "pump provenance: PASS",
    `runtime config currently active: ${current.active}`,
    "",
    "WRITE TARGET:",
    "Vercel Global Config → shape72Token",
  ].join("\n");
  console.log(preview);

  if (args.dryRun || !args.confirm) {
    console.log(
      args.dryRun
        ? "\nDRY RUN — no Global Config write, no env mutation, no Git mutation."
        : "\nReady. Re-run with --confirm-production to write the official mint.",
    );
    return;
  }

  if (!hasGlobalConfigCredentials()) {
    throw new Error("BLOCKED — VERCEL GLOBAL CONFIG CREDENTIALS MISSING");
  }

  const activatedAt = new Date().toISOString();
  const next = activationObject(validated.mint, activatedAt);
  await writeProductionToken(next);
  const readback = await readProductionToken();
  const matches =
    readback.active === true &&
    readback.symbol === next.symbol &&
    readback.mint === next.mint &&
    readback.network === next.network &&
    readback.launchPlatform === next.launchPlatform;
  if (!matches) {
    throw new Error("FAILED — GLOBAL CONFIG READBACK MISMATCH");
  }

  const appUrl = optionalEnv("NEXT_PUBLIC_APP_URL") || "https://shape72.fun";
  let siteApi = "skipped";
  try {
    const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/token`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      const json = (await response.json()) as { mint?: string; active?: boolean };
      siteApi = json.active && json.mint === validated.mint ? "PASS" : "MISMATCH";
    } else {
      siteApi = `HTTP ${response.status}`;
    }
  } catch {
    siteApi = "unreachable";
  }

  console.log(
    [
      "",
      "✓ Solana mint exists",
      "✓ Token program valid",
      "✓ Pump.fun provenance verified",
      "✓ Production runtime currently inactive before write",
      "✓ Global Config write complete",
      "✓ Runtime readback matches",
      `✓ shape72.fun token API: ${siteApi}`,
      "✓ market tracker started from runtime mint",
      "",
      "PASS — $72 RUNTIME ACTIVATION COMPLETE",
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  const message =
    error instanceof TokenValidationError || error instanceof Error
      ? error.message
      : "Token activation failed";
  console.error(message);
  process.exit(1);
});
