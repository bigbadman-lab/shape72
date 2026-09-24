import { readShapeStatuses } from "@/server/status";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const payload = await readShapeStatuses();
    return Response.json({
      mintEnabled: payload.mintEnabled,
      shapes: payload.shapes.map((shape) => ({
        id: shape.id,
        assetAddress: shape.assetAddress,
        status: shape.status,
        owner: shape.owner,
        ownerFull: shape.ownerFull,
      })),
    });
  } catch {
    return Response.json({ error: "STATUS_FAILED" }, { status: 500 });
  }
}
