import { loadOperatorEnv } from "../lib/env";
import { hasMintConfigCredentials, mintConfigStoreId, readProductionMint } from "./config";
import { readCollectionState, readInventory, readSiteMintEnabled } from "./preflight";

async function main() {
  loadOperatorEnv();
  const mint = hasMintConfigCredentials()
    ? await readProductionMint()
    : { enabled: false };
  const collection = await readCollectionState();
  const inventory = await readInventory();
  const site = await readSiteMintEnabled();

  console.log(
    [
      "SHAPE72 NFT MINT",
      "",
      `enabled: ${mint.enabled === true}`,
      `runtime config: ${hasMintConfigCredentials() ? "PASS" : "MISSING"}`,
      `site status API: ${site}`,
      `collection numMinted: ${collection.numMinted}`,
      `available: ${inventory.available}`,
    ].join("\n"),
  );

  if (!hasMintConfigCredentials() || mintConfigStoreId() === "") {
    throw new Error("BLOCKED — MINT RUNTIME CREDENTIALS MISSING");
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Mint verify failed";
  console.error(message);
  process.exit(1);
});
