import "server-only";
import type { Signer, Umi } from "@metaplex-foundation/umi";
import { loadAssetSigner } from "@/server/signers";

export function loadPredeterminedAssetSigner(umi: Umi, id: number): Signer {
  return loadAssetSigner(umi, id);
}
