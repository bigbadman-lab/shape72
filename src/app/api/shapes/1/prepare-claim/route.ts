import { isSolanaAddress } from "@/lib/solana";
import {
  Shape01PrepareError,
  prepareShape01Claim,
} from "@/server/shape01";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { claimant?: unknown };
    const claimant = typeof body.claimant === "string" ? body.claimant.trim() : "";
    if (!isSolanaAddress(claimant)) {
      return Response.json({ error: "INVALID_CLAIMANT" }, { status: 400 });
    }

    const prepared = await prepareShape01Claim(claimant);
    return Response.json({
      transaction: prepared.transaction,
      assetAddress: prepared.assetAddress,
      collectionAddress: prepared.collectionAddress,
      metadataUri: prepared.metadataUri,
      name: prepared.name,
      feePayer: prepared.feePayer,
      programs: prepared.programs,
      applicationSolTransfer: prepared.applicationSolTransfer,
    });
  } catch (error) {
    if (error instanceof Shape01PrepareError) {
      return Response.json(
        { error: error.code, message: error.message },
        { status: error.status },
      );
    }
    return Response.json({ error: "PREPARE_FAILED" }, { status: 500 });
  }
}
