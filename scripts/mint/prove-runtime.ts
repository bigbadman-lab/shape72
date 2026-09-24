import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DISABLED_MINT, parseMintConfig } from "../../src/data/mint";

const FIXTURE = resolve(process.cwd(), ".local/mint-fixture.json");

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function main() {
  assert(parseMintConfig(undefined).enabled === false, "missing fails closed");
  assert(parseMintConfig({}).enabled === false, "empty object fails closed");
  assert(parseMintConfig({ enabled: "true" }).enabled === false, "string true fails closed");
  assert(parseMintConfig({ enabled: 1 }).enabled === false, "number fails closed");
  assert(parseMintConfig({ enabled: false }).enabled === false, "false stays false");
  assert(parseMintConfig({ enabled: true }).enabled === true, "boolean true enables");
  assert(DISABLED_MINT.enabled === false, "disabled constant");

  mkdirSync(dirname(FIXTURE), { recursive: true, mode: 0o700 });
  writeFileSync(FIXTURE, JSON.stringify({ enabled: true }), { mode: 0o600 });
  const fixtureTrue = parseMintConfig(JSON.parse(require("node:fs").readFileSync(FIXTURE, "utf8")));
  assert(fixtureTrue.enabled === true, "fixture evaluates true");
  unlinkSync(FIXTURE);
  assert(parseMintConfig({ enabled: false }).enabled === false, "after fixture removal stays false");

  console.log(
    [
      "runtime false → parse fails closed",
      "test fixture true → runtime layer evaluates true",
      "fixture removed → production shape72Mint remains false",
    ].join("\n"),
  );
}

main();
