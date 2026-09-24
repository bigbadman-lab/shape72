import "server-only";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { signerIdentity, type Umi } from "@metaplex-foundation/umi";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { dedicatedRpcUrl } from "@/server/rpc";
import { loadOperatorSigner } from "@/server/signers";

export function createReadUmi(): Umi {
  return createUmi(dedicatedRpcUrl()).use(mplCore());
}

export function createOperatorUmi(): Umi {
  const umi = createReadUmi();
  umi.use(signerIdentity(loadOperatorSigner(umi)));
  return umi;
}
