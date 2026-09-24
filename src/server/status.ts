import "server-only";
import { fetchAllAssets } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { Connection, PublicKey } from "@solana/web3.js";
import { SHAPE_MANIFEST } from "@/data/manifest";
import { isSolanaAddress, shortenAddress } from "@/lib/solana";
import { STATUS_CACHE_MS } from "@/server/constants";
import { isPublicMintEnabled } from "@/server/env";
import { createReadUmi } from "@/server/operator-umi";
import { dedicatedRpcUrl } from "@/server/rpc";

export type PublicShapeStatus = {
  id: number;
  name: string;
  assetAddress: string;
  status: "available" | "owned";
  owner?: string;
  ownerFull?: string;
};

type Cache = {
  at: number;
  shapes: PublicShapeStatus[];
};

let cache: Cache | null = null;

export async function readShapeStatuses(): Promise<{
  mintEnabled: boolean;
  shapes: PublicShapeStatus[];
}> {
  if (cache && Date.now() - cache.at < STATUS_CACHE_MS) {
    return { mintEnabled: isPublicMintEnabled(), shapes: cache.shapes };
  }

  const connection = new Connection(dedicatedRpcUrl(), "confirmed");
  const pubkeys = SHAPE_MANIFEST.filter((entry) => isSolanaAddress(entry.assetAddress)).map(
    (entry) => new PublicKey(entry.assetAddress),
  );
  const infos = pubkeys.length
    ? await connection.getMultipleAccountsInfo(pubkeys, "confirmed")
    : [];

  const existing = pubkeys
    .filter((_, index) => Boolean(infos[index]))
    .map((key) => key.toBase58());

  const umi = existing.length > 0 ? createReadUmi() : null;
  const assets =
    umi && existing.length > 0
      ? await fetchAllAssets(umi, existing.map((address) => publicKey(address)), {
          skipDerivePlugins: true,
          chunkSize: 72,
        })
      : [];
  const owners = new Map(
    assets.map((asset) => [asset.publicKey.toString(), asset.owner.toString()]),
  );

  const shapes = SHAPE_MANIFEST.map((entry) => {
    const ownerFull = owners.get(entry.assetAddress);
    if (!ownerFull) {
      return {
        id: entry.id,
        name: entry.name,
        assetAddress: entry.assetAddress,
        status: "available" as const,
      };
    }
    return {
      id: entry.id,
      name: entry.name,
      assetAddress: entry.assetAddress,
      status: "owned" as const,
      owner: shortenAddress(ownerFull),
      ownerFull,
    };
  });

  cache = { at: Date.now(), shapes };
  return { mintEnabled: isPublicMintEnabled(), shapes };
}
