import { SOLANA_MAINNET_GENESIS } from "./constants";

type RpcResponse<T> = {
  result?: T;
  error?: { message?: string };
};

export function rpcEndpoint(): string {
  const url = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ?? "";
  if (!url) {
    throw new Error("NEXT_PUBLIC_SOLANA_RPC_URL is missing");
  }
  if (/api\.mainnet-beta\.solana\.com/i.test(url)) {
    throw new Error(
      "Dedicated RPC required for Mainnet collection writes. Public mainnet fallback is not allowed.",
    );
  }
  return url;
}

export async function rpcCall<T>(method: string, params: unknown[] = []): Promise<T> {
  const endpoint = rpcEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) {
    throw new Error(`RPC HTTP ${response.status}`);
  }
  const body = (await response.json()) as RpcResponse<T>;
  if (body.error?.message) {
    throw new Error(`RPC ${method} failed`);
  }
  if (body.result === undefined) {
    throw new Error(`RPC ${method} returned no result`);
  }
  return body.result;
}

export async function assertMainnetRpc(): Promise<void> {
  const genesis = await rpcCall<string>("getGenesisHash");
  if (genesis !== SOLANA_MAINNET_GENESIS) {
    throw new Error("RPC is not Solana Mainnet");
  }
  await rpcCall<string>("getHealth");
}
