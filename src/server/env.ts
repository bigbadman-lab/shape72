import "server-only";

export function serverEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function requireServerEnv(name: string): string {
  const value = serverEnv(name);
  if (!value) {
    throw new Error(`${name} is missing`);
  }
  return value;
}

export function isCanaryEnabled(): boolean {
  return serverEnv("SHAPE72_CANARY_SHAPE01_ENABLED") === "true";
}
