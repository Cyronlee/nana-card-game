import { kv } from "@vercel/kv";
import { shuffle } from "@/lib/random";
import {
  allRevealedCards,
  challengeFailed,
  challengeSuccess,
  concealAllCards,
  findMinUnrevealedCardId,
  findUnrevealedCardId,
  getCurrentAndNextPlayer,
  isTurnOver,
  removeTargetCards,
} from "@/lib/game-helper";
import { Action, Card, ServerState } from "@/types";
import playerInfo from "@/components/PlayerInfo";
import { ALL_CARDS, GAME_RULES } from "@/lib/rules";

// const INIT_CARD_IDS = [
//   "1-a",
//   "1-b",
//   "1-c",
//   "2-a",
//   "2-b",
//   "2-c",
//   "3-a",
//   "3-b",
//   "3-c",
// ];
//
// const INIT_CARDS: Card[] = INIT_CARD_IDS.map((id) => ({
//   id: id,
//   number: id.split("-")[0] as unknown as number,
//   isRevealed: false,
// }));

export async function POST(request: Request) {
  try {
    const action = (await request.json()) as Action;

    // TODO use state design pattern
    switch (action.action) {
      case "action:host": {
      }
    }
    if (action.action === "action:host") {
      await kv.set<ServerState>(
        `game:${action.gameId}`,
        {
          gameId: action.gameId,
          gameStage: "stage:lobby",
          timestamp: Date.now(),
          players: [
            {
              id: action.data.playerId,
              name: action.data.playerName,
              seat: 1,
              isHost: true,
              isPlaying: false,
              hand: [],
              collection: [],
            },
          ],
          cardDeck: ALL_CARDS,
          publicCards: [],
        },
        { ex: 60 * 60 },
      );
    }

    const serverState = await getServerState(action.gameId);
    const [currentPlayer] = getCurrentAndNextPlayer(serverState.players);
    const playerNumber = serverState.players.length;

    if (action.action === "action:join") {
      if (serverState.gameStage !== "stage:lobby") {
        throw new Error("can not join, game is already start");
      }
      if (
        playerNumber >= 6 &&
        serverState.players.some((p) => p.id === action.playerId)
      ) {
        throw new Error("only support 2 players now");
      }
      serverState.players.push({
        id: action.playerId,
        name: action.data.playerName,
        seat: playerNumber + 1,
        isHost: false,
        isPlaying: false,
        hand: [],
        collection: [],
      });
    }

    if (action.action === "action:start-game") {
      // if (serverState.gameStage !== "stage:lobby") {
      //   throw new Error("game is already start");
      // }
      if (playerNumber <= 1) {
        throw new Error("requires two or more players");
      }
      const gameRule = GAME_RULES[playerNumber];

      let shuffled: Card[] = shuffle([...gameRule.cards]);

      Object.assign<ServerState, Partial<ServerState>>(serverState, {
        gameStage: "stage:in-game",
        gameSubStage: "sub:playing",
        cardDeck: [],
        players: serverState.players.map((p, i) => ({
          ...p,
          hand: shuffled
            .splice(0, gameRule.handNumber)
            .sort((a, b) => a.number - b.number),
          collection: [],
          isPlaying: i === 0,
        })),
        publicCards: shuffled,
      });
    }

    if (action.action === "action:reveal-public-card") {
      if (currentPlayer.id !== action.playerId) {
        throw new Error("not your turn now");
      }
      if (serverState.gameSubStage === "sub:settling") {
        throw new Error("this round is over, please waiting the settlement");
      }
      Object.assign<ServerState, Partial<ServerState>>(serverState, {
        publicCards: serverState.publicCards?.map((c) => ({
          ...c,
          isRevealed: c.id === action.data.cardId ? true : c.isRevealed,
        })),
      });

      if (isTurnOver(serverState)) {
        Object.assign<ServerState, Partial<ServerState>>(serverState, {
          gameSubStage: "sub:settling",
          timestamp: Date.now(),
        });
        // does not work in vercel serverless function, maybe process shut down when return
        // settling and restore all cards
        // setTimeout(() => {
        //   settleAndNextRound(action, serverState);
        // }, 100);
      }
    }

    // if (action.action === "action:reveal-player-card") {
    //   if (currentPlayer.id !== action.playerId) {
    //     throw new Error("not your turn now");
    //   }
    //   let playerIndex = serverState.players.findIndex(
    //     (p) => p.id === action.data.playerId,
    //   );
    //   const cardIndex = serverState.players[playerIndex].hand?.findIndex(
    //     (c) => c.id === action.data.cardId,
    //   );
    //   serverState.players[playerIndex].hand[cardIndex].isRevealed = true;
    //
    //   if (isTurnOver(serverState)) {
    //     Object.assign<ServerState, Partial<ServerState>>(serverState, {
    //       gameSubStage: "sub:settling",
    //       timestamp: Date.now(),
    //     });
    //   }
    // }

    if (action.action === "action:reveal-player-card") {
      if (currentPlayer.id !== action.playerId) {
        throw new Error("not your turn now");
      }
      const targetPlayer = serverState.players.find(
        (p) => p.id === action.data.targetPlayerId,
      );
      let unrevealedCardId = findUnrevealedCardId(
        targetPlayer?.hand,
        action.data.minMax,
      );
      if (!unrevealedCardId) {
        throw new Error("no more card");
      }

      const unrevealedCard = targetPlayer?.hand.find(
        (c) => c.id === unrevealedCardId,
      );
      unrevealedCard.isRevealed = true;

      if (isTurnOver(serverState)) {
        Object.assign<ServerState, Partial<ServerState>>(serverState, {
          gameSubStage: "sub:settling",
          timestamp: Date.now(),
        });
      }
    }

    // TODO player win this round
    // TODO next round
    // TODO game over

    await replaceState(action.gameId, serverState);

    return Response.json({ status: "ok" });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}

const getServerState = async (gameId: string) => {
  const serverState = await kv.get<ServerState>(`game:${gameId}`);
  if (!serverState) {
    throw new Error(`No game found for gameId: ${gameId}`);
  }
  return serverState;
};

export async function replaceState(gameId: string, serverState: ServerState) {
  await kv.set<ServerState>(`game:${gameId}`, serverState);
}

export const settleAndNextRound = async (
  gameId: string,
  serverState: ServerState,
) => {
  const revealedCards = allRevealedCards(serverState);
  let [currentPlayer, nextPlayer] = getCurrentAndNextPlayer(
    serverState.players,
  );
  if (challengeFailed(revealedCards)) {
    // do nothing
  } else if (challengeSuccess(revealedCards)) {
    removeTargetCards(serverState, revealedCards[0].number);
    currentPlayer.collection = [...currentPlayer.collection, ...revealedCards];
  }

  currentPlayer.isPlaying = false;
  nextPlayer.isPlaying = true;

  serverState.gameSubStage = "sub:playing";
  serverState.timestamp = Date.now();
  concealAllCards(serverState);

  await replaceState(gameId, serverState);
};

export const runtime = "nodejs";
export const fetchCache = "force-no-store";
