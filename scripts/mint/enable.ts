import { loadOperatorEnv } from "../lib/env";
import { MINT_CONFIG_KEY } from "../../src/data/mint";
import { hasMintConfigCredentials, readProductionMint, writeProductionMint } from "./config";
import {
  assertSignerHealth,
  readCollectionState,
  readInventory,
  readSignerHealth,
  readTokenIsolation,
} from "./preflight";

function wantsConfirm(argv: string[]) {
  return argv.includes("--confirm-production");
}

async function main() {
  loadOperatorEnv();
  if (!hasMintConfigCredentials()) {
    throw new Error("BLOCKED — VERCEL GLOBAL CONFIG CREDENTIALS MISSING");
  }

  const current = await readProductionMint();
  const health = await readSignerHealth();
  assertSignerHealth(health);
  const collection = await readCollectionState();
  if (!collection.exists || !collection.sane) {
    throw new Error("BLOCKED — COLLECTION CHECK FAILED");
  }
  const inventory = await readInventory();
  if (inventory.uniqueAddresses !== 72 || inventory.available < 1 || !inventory.shape02Present) {
    throw new Error("BLOCKED — MANIFEST / INVENTORY CHECK FAILED");
  }
  const token = await readTokenIsolation();

  console.log(
    [
      "SHAPE72 NFT MINT ENABLE",
      "",
      `current: ${current.enabled === true}`,
      "target: true",
      `collection: ${collection.sane ? "PASS" : "FAIL"}`,
      "signer health: PASS",
      `available Shapes: ${inventory.available}`,
      `$72 active: ${token.active} (not a mint precondition)`,
      "",
      "WRITE TARGET:",
      `Vercel Global Config → ${MINT_CONFIG_KEY}.enabled = true`,
    ].join("\n"),
  );

  if (!wantsConfirm(process.argv)) {
    console.log("\nPREVIEW ONLY — NO WRITE");
    return;
  }

  await writeProductionMint({
    enabled: true,
    enabledAt: new Date().toISOString(),
  });
  const readback = await readProductionMint();
  if (readback.enabled !== true) {
    throw new Error("FAILED — MINT ENABLE READBACK MISMATCH");
  }
  console.log("\nPASS — NFT MINT RUNTIME ENABLED");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Mint enable failed";
  console.error(message);
  process.exit(1);
});
