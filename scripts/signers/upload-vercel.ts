import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { loadOperatorEnv } from "../lib/env";

const PROJECT_ID = "prj_3WwunRrISZx3CIL9cQSawcuGz1SW";
const TEAM_ID = "team_cXtra9j773p5FrqiSzUObJ4A";
const ARTIFACT = resolve(process.cwd(), ".local/production-signers.env");
const HEALTH_FILE = resolve(process.cwd(), ".local/operator-health.secret");

type EnvRow = { id?: string; key?: string; target?: string[]; type?: string };

function parseDotEnv(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const eq = line.indexOf("=");
    out[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return out;
}

function token(): string {
  const fromEnv = process.env.VERCEL_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  const authPath = resolve(
    process.env.HOME || "",
    "Library/Application Support/com.vercel.cli/auth.json",
  );
  const auth = JSON.parse(readFileSync(authPath, "utf8")) as { token?: string };
  if (!auth.token) throw new Error("VERCEL_TOKEN is missing");
  return auth.token;
}

async function vercel(method: string, path: string, body?: unknown) {
  const url = new URL(`https://api.vercel.com${path}`);
  url.searchParams.set("teamId", TEAM_ID);
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }
  if (!response.ok) {
    throw new Error(`Vercel ${method} ${path} failed: ${response.status}`);
  }
  return json;
}

function healthSecret(): string {
  if (existsSync(HEALTH_FILE)) {
    const existing = readFileSync(HEALTH_FILE, "utf8").trim();
    if (existing) return existing;
  }
  const generated = randomBytes(32).toString("hex");
  writeFileSync(HEALTH_FILE, `${generated}\n`, { mode: 0o600 });
  return generated;
}

async function upsertEncrypted(key: string, value: string, existing: EnvRow[]) {
  const matches = existing.filter((row) => row.key === key && row.target?.includes("production"));
  for (const row of matches) {
    if (row.id) {
      await vercel("DELETE", `/v9/projects/${PROJECT_ID}/env/${row.id}`);
    }
  }
  await vercel("POST", `/v10/projects/${PROJECT_ID}/env`, {
    key,
    value,
    type: "encrypted",
    target: ["production"],
  });
}

async function main() {
  loadOperatorEnv();
  const artifact = parseDotEnv(ARTIFACT);
  const operator = artifact.SHAPE72_OPERATOR_SECRET_KEY_B64 || "";
  const assets = artifact.SHAPE72_ASSET_SIGNERS_B64 || "";
  if (!operator || !assets) {
    throw new Error("Production signer artifact is missing");
  }
  if (assets.length > 60_000) {
    throw new Error("BLOCKED — ASSET SIGNER BLOB EXCEEDS SAFE VERCEL ENV SIZE");
  }

  const listed = (await vercel("GET", `/v9/projects/${PROJECT_ID}/env`)) as {
    envs?: EnvRow[];
  };
  const existing = listed.envs || [];
  const names = existing.map((row) => row.key).filter(Boolean);

  if (names.includes("SHAPE72_OPERATOR_KEYPAIR_PATH") || names.includes("SHAPE72_ASSET_KEYPAIR_DIR")) {
    throw new Error("BLOCKED — filesystem signer paths must not exist on Vercel");
  }

  await upsertEncrypted("SHAPE72_OPERATOR_SECRET_KEY_B64", operator, existing);
  await upsertEncrypted("SHAPE72_ASSET_SIGNERS_B64", assets, existing);
  await upsertEncrypted("SHAPE72_OPERATOR_HEALTH_SECRET", healthSecret(), existing);

  const mint = existing.find(
    (row) => row.key === "SHAPE72_PUBLIC_MINT_ENABLED" && row.target?.includes("production"),
  );
  if (!mint) {
    await vercel("POST", `/v10/projects/${PROJECT_ID}/env`, {
      key: "SHAPE72_PUBLIC_MINT_ENABLED",
      value: "false",
      type: "encrypted",
      target: ["production"],
    });
  }

  console.log(
    [
      "SHAPE72_OPERATOR_SECRET_KEY_B64: present",
      "SHAPE72_ASSET_SIGNERS_B64: present",
      "SHAPE72_OPERATOR_HEALTH_SECRET: present",
      `operator secret bytes: ${operator.length}`,
      `asset blob bytes: ${assets.length}`,
      "SHAPE72_PUBLIC_MINT_ENABLED: false",
      "filesystem signer paths: absent",
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Vercel signer upload failed";
  console.error(message);
  process.exit(1);
});
