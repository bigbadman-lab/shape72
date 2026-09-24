import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadOperatorEnv } from "../lib/env";

const require = createRequire(import.meta.url);
const Module = require("node:module") as {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};
const originalLoad = Module._load.bind(Module);
Module._load = (request: string, parent: unknown, isMain: boolean) => {
  if (request === "server-only") return {};
  return originalLoad(request, parent, isMain);
};

function loadProductionSignerArtifact() {
  const artifact = resolve(process.cwd(), ".local/production-signers.env");
  if (!existsSync(artifact)) return;
  for (const rawLine of readFileSync(artifact, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const eq = line.indexOf("=");
    process.env[line.slice(0, eq)] = line.slice(eq + 1);
  }
}

async function main() {
  loadOperatorEnv();
  loadProductionSignerArtifact();
  const { parseShapeId, rehearseShapeClaim } = await import("../../src/server/mint");
  const { signerBackend } = await import("../../src/server/signers");
  const id = parseShapeId(process.argv[2] || "72");
  const claimant = (process.argv[3] || "").trim();
  if (!claimant) {
    throw new Error("Usage: npm run mint:rehearse-production -- <id> <CLAIMANT_PUBKEY>");
  }

  const prepared = await rehearseShapeClaim(id, claimant);
  const backend = signerBackend();
  if (backend !== "production-secret") {
    throw new Error(`Expected production-secret backend, got ${backend}`);
  }
  console.log(
    [
      `shape: ${id}`,
      `asset address: ${prepared.assetAddress}`,
      "operator signer: MATCH",
      "asset signer: MATCH",
      `claimant: ${claimant}`,
      `fee payer: ${prepared.feePayer}`,
      `signer backend: ${backend}`,
      `application mint price: ${prepared.applicationSolTransfer} SOL`,
      `programs: ${prepared.programs.join(", ")}`,
      "partial server signatures: applied",
      "broadcast: NO",
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Mint rehearsal failed";
  console.error(message);
  process.exit(1);
});
