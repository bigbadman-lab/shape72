/** Public Solana mainnet RPC used only when no dedicated URL is configured. */
export const SOLANA_MAINNET_RPC_FALLBACK = "https://api.mainnet-beta.solana.com";

const BASE58_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function getSolanaRpcUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  return configured || SOLANA_MAINNET_RPC_FALLBACK;
}

export function isSolanaAddress(
  value: string | undefined | null,
): value is string {
  return typeof value === "string" && BASE58_ADDRESS.test(value);
}

export function shortenAddress(
  address: string,
  leading = 4,
  trailing = 4,
): string {
  if (address.length <= leading + trailing + 3) return address;
  return `${address.slice(0, leading)}...${address.slice(-trailing)}`;
}
