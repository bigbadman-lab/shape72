import { Connection, VersionedTransaction } from "@solana/web3.js";
import { getSolanaRpcUrl } from "@/lib/solana";

export type ShapeClaimPhase =
  | "idle"
  | "preparing"
  | "awaiting-signature"
  | "confirming";

export type SolanaWalletSigner = {
  signTransaction: <T extends VersionedTransaction>(transaction: T) => Promise<T>;
};

type PrepareResponse = {
  transaction?: string;
  assetAddress?: string;
  error?: string;
  message?: string;
};

export async function claimShape(options: {
  id: number;
  claimant: string;
  wallet: SolanaWalletSigner;
  onPhase: (phase: ShapeClaimPhase) => void;
}): Promise<{ signature: string; assetAddress: string }> {
  options.onPhase("preparing");

  const response = await fetch(`/api/shapes/${options.id}/prepare-claim`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ claimant: options.claimant }),
  });
  const body = (await response.json()) as PrepareResponse;
  if (!response.ok || !body.transaction || !body.assetAddress) {
    throw new Error(body.message || body.error || "Shape prepare failed");
  }

  const bytes = Uint8Array.from(atob(body.transaction), (char) =>
    char.charCodeAt(0),
  );
  const transaction = VersionedTransaction.deserialize(bytes);

  options.onPhase("awaiting-signature");
  const signed = await options.wallet.signTransaction(transaction);

  options.onPhase("confirming");
  const connection = new Connection(getSolanaRpcUrl(), "confirmed");
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
  });
  const confirmation = await connection.confirmTransaction(signature, "confirmed");
  if (confirmation.value.err) {
    throw new Error("Shape transaction failed to confirm");
  }

  return { signature, assetAddress: body.assetAddress };
}
