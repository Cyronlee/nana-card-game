import { kv } from "@vercel/kv";
import { GameStage, GameSubStage } from "@/types";
import { Card } from "@/types/server";
import { popRandom, shuffle } from "@/lib/random";

export type GameStagePrefix = `stage:${string}`;
export type ActionPrefix = `action:${string}`;

interface Player {
  id: string;
  name: string;
  isHost?: boolean;
  hand?: Card[];
}

interface ServerState {
  gameStage: GameStagePrefix;
  gameSubStage?: string;
  players: Player[];
  cardDeck?: Card[];
  // player1Cards?: Card[];
  // player2Cards?: Card[];
  publicCards?: Card[];
}

export interface Action {
  gameId: string;
  playerId: string;
  action: ActionPrefix;
  data?: any;
}

const INIT_CARD_IDS = [
  "1-a",
  "1-b",
  "1-c",
  "2-a",
  "2-b",
  "2-c",
  "3-a",
  "3-b",
  "3-c",
];

const INIT_CARDS: Card[] = INIT_CARD_IDS.map((id) => ({
  id: id,
  number: id.split("-")[0] as unknown as number,
  isRevealed: false,
}));

export async function POST(request: Request) {
  try {
    const action = (await request.json()) as Action;

    if (action.action === "action:host") {
      await kv.set<ServerState>(
        `game:${action.gameId}`,
        {
          gameStage: "stage:lobby",
          players: [
            {
              id: action.data.playerId,
              name: action.data.playerName,
              isHost: true,
            },
          ],
          cardDeck: [...INIT_CARDS],
          publicCards: [],
        },
        { ex: 60 * 60 },
      );
    }

    const serverState = await getState(action.gameId);

    if (action.action === "action:join") {
      if (serverState.gameStage !== "stage:lobby") {
        throw new Error("can not join, game is already start");
      }
      serverState.players.push({
        id: action.data.playerId,
        name: action.data.playerName,
      });
    }
    if (action.action === "action:start-game") {
      if (serverState.gameStage !== "stage:lobby") {
        throw new Error("game is already start");
      }
      let shuffled = shuffle([...INIT_CARDS]);

      Object.assign<ServerState, Partial<ServerState>>(serverState, {
        gameStage: "stage:in-game",
        cardDeck: [],
        players: serverState.players.map((p) => ({
          ...p,
          hand: shuffled.splice(0, 3),
        })),
        publicCards: shuffled,
      });
    }

    if (action.action === "action:reveal-public-card") {
      Object.assign<ServerState, Partial<ServerState>>(serverState, {
        publicCards: serverState.publicCards?.map((c) => ({
          ...c,
          isRevealed: c.id === action.data.cardId ? true : c.isRevealed,
        })),
      });
    }

    if (action.action === "action:reveal-player-card") {
      let playerIndex = serverState.players.findIndex(
        (p) => p.id === action.data.playerId,
      );
      const cardIndex = serverState.players[playerIndex].hand.findIndex(
        (c) => c.id === action.data.cardId,
      );
      serverState.players[playerIndex].hand[cardIndex].isRevealed = true;
    }

    await replaceState(action.gameId, serverState);

    return Response.json(serverState);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}

const getState = async (gameId: string) => {
  const serverState = await kv.get<ServerState>(`game:${gameId}`);
  if (!serverState) {
    throw new Error(`No game found for gameId: ${gameId}`);
  }
  return serverState;
};

async function replaceState(gameId: string, serverState: ServerState) {
  await kv.set<ServerState>(`game:${gameId}`, serverState);
}

async function updateState(gameId: string, partial: Partial<ServerState>) {
  const key = `game:${gameId}`;
  const serverState = await kv.get<ServerState>(key);
  if (serverState) {
    Object.assign(serverState, partial);
    await kv.set<ServerState>(key, serverState);
  } else {
    throw new Error(`No server state found for gameId: ${gameId}`);
  }
}

async function updateState2<T>(
  gameId: string,
  updater: (prevState: T) => Partial<T>,
) {
  const key = `game:${gameId}`;
  const prevState = await kv.get<T>(key);
  if (prevState) {
    const partialState = updater(prevState);
    const newState = { ...prevState, ...partialState };
    await kv.set<T>(key, newState);
  } else {
    throw new Error(`No server state found for gameId: ${gameId}`);
  }
}

export const runtime = "edge";
export const fetchCache = "force-no-store";
