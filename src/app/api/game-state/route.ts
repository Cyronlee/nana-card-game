import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameId = searchParams.get("id");
  const key = searchParams.get("key");
  console.debug(key);

  const gameState = await kv.get(`game:${gameId}`);

  return Response.json(gameState);
}

export const runtime = "edge";
export const fetchCache = "force-no-store";
