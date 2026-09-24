import { loadOperatorEnv } from "../lib/env";
import { MINT_CONFIG_KEY } from "../../src/data/mint";
import { hasMintConfigCredentials, readProductionMint, writeProductionMint } from "./config";

function wantsConfirm(argv: string[]) {
  return argv.includes("--confirm-production");
}

async function main() {
  loadOperatorEnv();
  if (!hasMintConfigCredentials()) {
    throw new Error("BLOCKED — VERCEL GLOBAL CONFIG CREDENTIALS MISSING");
  }

  const current = await readProductionMint();
  console.log(
    [
      "SHAPE72 NFT MINT DISABLE",
      "",
      `current: ${current.enabled === true}`,
      "target: false",
      "",
      "WRITE TARGET:",
      `Vercel Global Config → ${MINT_CONFIG_KEY}.enabled = false`,
      "",
      "OFF switch affects new prepare-claim only.",
      "Existing NFTs and $72 runtime are unchanged.",
    ].join("\n"),
  );

  if (!wantsConfirm(process.argv)) {
    console.log("\nPREVIEW ONLY — NO WRITE");
    return;
  }

  await writeProductionMint({ enabled: false, enabledAt: null });
  const readback = await readProductionMint();
  if (readback.enabled !== false) {
    throw new Error("FAILED — MINT DISABLE READBACK MISMATCH");
  }
  console.log("\nPASS — NFT MINT RUNTIME DISABLED");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Mint disable failed";
  console.error(message);
  process.exit(1);
});
