import { isSolanaAddress } from "@/lib/solana";
import { parseShapeId, prepareShapeClaim, ShapePrepareError } from "@/server/mint";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseShapeId(rawId);
    const body = (await request.json()) as { claimant?: unknown };
    const claimant = typeof body.claimant === "string" ? body.claimant.trim() : "";
    if (!isSolanaAddress(claimant)) {
      return Response.json({ error: "INVALID_CLAIMANT" }, { status: 400 });
    }

    const prepared = await prepareShapeClaim(id, claimant);
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
    if (error instanceof ShapePrepareError) {
      return Response.json(
        { error: error.code, message: error.message },
        { status: error.status },
      );
    }
    return Response.json({ error: "PREPARE_FAILED" }, { status: 500 });
  }
}
