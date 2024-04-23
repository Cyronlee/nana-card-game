import { create } from "zustand";
import { popRandom, shuffle } from "@/lib/random";
import { immer } from "zustand/middleware/immer";
import { ServerGameState } from "@/types/server";

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

interface Card {
  id: string;
  number: number;
  isRevealed: boolean;
}

interface Player {
  id: string;
  name?: string;
  isMe?: boolean;
  isPlaying?: boolean;
  hand: Card[];
  collection: Card[];
}

type GameStage = string;
type GameSubStage = string;

interface GameState {
  gameStage: GameStage;
  gameSubStage: GameSubStage;
  cardDeck: Card[];
  publicCards: Card[];
  players: Player[];
  // myCards: string[];
  // botCards: string[];
}
interface GameStateActions {
  resetTable: any;
  getPlayer: (playerId: string) => Player;
  // dealToMe: any;
  // dealRandomCardTo: any;
  // getRevealedCards: any;
  // setGameStage: any;
  // revealPlayerCard: any;
  // revealPublicCard: any;
  // dealRestOfCards: any;
  updateCardDeck: any;
  dealCard: any;
  updatePlayers: any;
}

export const useClientGameStore = create<GameState & GameStateActions>()(
  immer((set, get) => ({
    gameStage: "seat",
    gameSubStage: undefined,
    cardDeck: [],
    publicCards: [],
    players: [],

    // functions
    updatePlayers: (players: Player[]) =>
      set({
        players: players.map((p) => ({
          ...p,
          hand: [],
          collection: [],
        })),
      }),
    updateCardDeck: (cardDeck: Card[]) =>
      set({
        cardDeck: cardDeck,
      }),
    // functions
    getPlayer: (playerId: string) => {
      return get().players.find((p) => p.id === playerId);
    },

    dealCard: (cardId: string, playerId: string) => {
      console.log(`deal card: ${cardId} to player: ${playerId}`);
      set((state) => {
        let poppedCard = popCard(state.cardDeck, cardId);
        state.cardDeck.filter((c) => c.id != cardId);
        let targetPlayer = state.players.find((p) => p.id === playerId);
        if (!targetPlayer) {
          targetPlayer = {
            id: playerId,
            hand: [],
            collection: [],
          };
          state.players.push(targetPlayer);
        }
        targetPlayer.hand.push(poppedCard);
        // state.players[0].hand.push(popCard);
      });
    },
  })),
);

const popCard = (cards: Card[], cardId: string) => {
  const cardIndex = cards.findIndex((c) => c.id === cardId);
  const [removedCard] = cards.splice(cardIndex, 1);
  return removedCard;
};
