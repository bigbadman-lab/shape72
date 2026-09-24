import "server-only";
import { serverEnv } from "@/server/env";

export const SOLANA_MAINNET_GENESIS =
  "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

export const MPL_CORE_PROGRAM = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
export const SYSTEM_PROGRAM = "11111111111111111111111111111111";
export const COMPUTE_BUDGET_PROGRAM = "ComputeBudget111111111111111111111111111111";
export const SPL_NOOP_PROGRAM = "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV";

type RpcResponse<T> = {
  result?: T;
  error?: { message?: string };
};

export function dedicatedRpcUrl(): string {
  const url = serverEnv("NEXT_PUBLIC_SOLANA_RPC_URL");
  if (!url) {
    throw new Error("NEXT_PUBLIC_SOLANA_RPC_URL is missing");
  }
  if (/api\.mainnet-beta\.solana\.com/i.test(url)) {
    throw new Error("Dedicated RPC required");
  }
  return url;
}

export async function rpcCall<T>(method: string, params: unknown[] = []): Promise<T> {
  const response = await fetch(dedicatedRpcUrl(), {
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
