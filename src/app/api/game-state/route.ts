import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";
import { ServerState } from "@/types";
import { getCurrentAndNextPlayer, isGameOver } from "@/lib/game-helper";
import { markGameOver, settleAndNextRound } from "@/app/api/action/route";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameId = searchParams.get("id");
  const playerId = searchParams.get("playerId");

  if (gameId == null || playerId == null) {
    return Response.json({ error: "no permission" }, { status: 400 });
  }

  const serverState = await kv.get<ServerState>(`game:${gameId}`);

  if (serverState?.gameSubStage === "sub:settling") {
    if (Date.now() - serverState.timestamp > 2000) {
      // start to settle
      if (isGameOver(serverState)) {
        await markGameOver(gameId, serverState);
      } else {
        let [currentPlayer] = getCurrentAndNextPlayer(serverState.players);
        if (currentPlayer.id === playerId) {
          await settleAndNextRound(gameId, serverState);
        }
      }
    }
  }

  // TODO add error case
  // error: game not found
  // error: you are not in this game

  return Response.json(serverState);
}

export const runtime = "edge";
export const fetchCache = "force-no-store";
