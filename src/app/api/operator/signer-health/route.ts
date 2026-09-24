import { createReadUmi } from "@/server/operator-umi";
import { inspectSignerHealth, signerBackend } from "@/server/signers";
import { serverEnv } from "@/server/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const expected = serverEnv("SHAPE72_OPERATOR_HEALTH_SECRET");
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!expected || !provided || provided !== expected) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const health = inspectSignerHealth(createReadUmi());
    return Response.json({
      operatorPresent: health.operatorPresent,
      assetSignerCount: health.assetSignerCount,
      allManifestMatches: health.allManifestMatches,
      backend: signerBackend(),
      mintEnabled: serverEnv("SHAPE72_PUBLIC_MINT_ENABLED") === "true",
    });
  } catch {
    return Response.json({ error: "SIGNER_HEALTH_FAILED" }, { status: 500 });
  }
}
