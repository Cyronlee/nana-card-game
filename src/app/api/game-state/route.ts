import { getRedis } from "@/lib/redis";
import { NextRequest } from "next/server";
import { ServerState } from "@/types";
import { getCurrentAndNextPlayer, findWinner } from "@/lib/game-helper";
import { setGameOver, settleAndNextRound } from "@/app/api/action/route";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameId = searchParams.get("id");
  const playerId = searchParams.get("playerId");

  if (gameId == null || playerId == null) {
    return Response.json(
      { error: "you are not in this game, please join from the home page" },
      { status: 400 },
    );
  }

  const redis = await getRedis();
  const data = await redis.get(`game:${gameId}`);
  const serverState = data ? (JSON.parse(data) as ServerState) : null;

  if (!serverState?.players.some((p) => p.id === playerId)) {
    return Response.json(
      { error: "you are not in this game, please join from the home page" },
      { status: 400 },
    );
  }

  if (serverState?.gameSubStage === "sub:settling") {
    if (Date.now() - serverState.timestamp > 2000) {
      // start to settle
      let [currentPlayer] = getCurrentAndNextPlayer(serverState.players);
      if (currentPlayer.id === playerId) {
        await settleAndNextRound(gameId, serverState);

        let winner = findWinner(serverState);
        if (winner) {
          await setGameOver(gameId, serverState, winner.id);
        }
      }
    }
  }

  // TODO add error case
  // error: game not found
  // error: you are not in this game

  return Response.json(serverState);
}

export const runtime = "nodejs";
export const fetchCache = "force-no-store";
