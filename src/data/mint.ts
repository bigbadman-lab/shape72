export const MINT_CONFIG_KEY = "shape72Mint";

export type MintRuntimeConfig = {
  enabled: boolean;
  enabledAt?: string | null;
};

export const DISABLED_MINT: MintRuntimeConfig = {
  enabled: false,
  enabledAt: null,
};

export function parseMintConfig(value: unknown): MintRuntimeConfig {
  if (!value || typeof value !== "object") return { ...DISABLED_MINT };
  const row = value as Record<string, unknown>;
  if (row.enabled !== true) return { ...DISABLED_MINT };
  return {
    enabled: true,
    enabledAt: typeof row.enabledAt === "string" ? row.enabledAt : null,
  };
}
