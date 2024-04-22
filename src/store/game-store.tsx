import { create } from "zustand";
import { popRandom, shuffle } from "@/lib/random";
import { immer } from "zustand/middleware/immer";

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
  name: string;
  isMe: boolean;
  isPlaying: boolean;
  hand: Card[];
  collection: Card[];
}

type GameStage = "seat" | "in-game" | "game-over";
type GameSubStage = "my-turn" | "bot-turn" | "win" | "loose" | undefined;

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
  dealRandomCardTo: any;
  getRevealedCards: any;
  setGameStage: any;
  revealPlayerCard: any;
  revealPublicCard: any;
  dealRestOfCards: any;
}

export const useGameStore = create<GameState & GameStateActions>()(
  immer((set, get) => ({
    gameStage: "seat",
    gameSubStage: undefined,
    cardDeck: INIT_CARDS,
    publicCards: [],
    players: [
      {
        id: "me",
        name: "Me",
        isMe: true,
        isPlaying: false,
        hand: [],
        collection: [],
      },
      {
        id: "bot",
        name: "Bot",
        isMe: false,
        isPlaying: false,
        hand: [],
        collection: [],
      },
    ],

    resetTable: () => {
      set({
        gameStage: "seat",
        gameSubStage: undefined,
        cardDeck: INIT_CARDS,
        publicCards: [],
        players: [
          {
            id: "me",
            name: "Me",
            isMe: true,
            isPlaying: false,
            hand: [],
            collection: [],
          },
          {
            id: "bot",
            name: "Bot",
            isMe: false,
            isPlaying: false,
            hand: [],
            collection: [],
          },
        ],
      });
    },

    // functions
    setGameStage: (stage: GameStage) =>
      set({
        gameStage: stage,
      }),
    setGameSubStage: (stage: GameSubStage) =>
      set({
        gameSubStage: stage,
      }),
    getPlayer: (playerId: string) => {
      return get().players.find((p) => p.id === playerId);
    },
    getRevealedCards: () => {
      let activeCards = [...get().publicCards];
      get().players.forEach((u) => activeCards.push(...u.hand));
      return activeCards.filter((c) => c.isRevealed);
    },
    revealPlayerCard: (playerId: string, cardId: string) => {
      set((state) => {
        const targetPlayer = state.players.find((p) => p.id === playerId);
        targetPlayer.hand.find((c) => c.id === cardId).isRevealed = true;
      });
    },
    revealPublicCard: (cardId: string) => {
      set((state) => {
        state.publicCards.find((c) => c.id === cardId).isRevealed = true;
      });
    },
    dealRandomCardTo: (playerId: string) => {
      set((state) => {
        const popCard = popRandom(state.cardDeck);
        const targetPlayer = state.players.find((p) => p.id === playerId);
        targetPlayer.hand.push(popCard);
        // state.players[0].hand.push(popCard);
      });
    },
    dealRestOfCards: () => {
      set((state) => {
        const restOfCards = [...state.cardDeck];
        state.cardDeck = [];
        state.publicCards = restOfCards;
        // state.players[0].hand.push(popCard);
      });
    },
    sortPlayerCards: () => {},
  })),
);
