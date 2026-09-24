import { readTokenRuntime } from "@/server/token/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const token = await readTokenRuntime();
    return Response.json(token);
  } catch {
    return Response.json({ error: "TOKEN_READ_FAILED" }, { status: 500 });
  }
}
