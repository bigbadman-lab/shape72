import { readTokenMarket } from "@/server/token/market";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const market = await readTokenMarket();
    return Response.json(market);
  } catch {
    return Response.json({ error: "TOKEN_MARKET_FAILED" }, { status: 500 });
  }
}
