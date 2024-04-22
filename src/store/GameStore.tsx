import { create } from "zustand";

const INIT_GAME_CARDS = [
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

interface GameState {
  cardDeck: string[];
  myCards: string[];
  botCards: string[];
  publicCards: string[];
  reset: any;
  dealToMe: any;
  dealToBot: any;
  dealToPublic: any;
  sortPlayerCards: any;
}

export const useGameStore = create<GameState>()((set, get) => ({
  cardDeck: INIT_GAME_CARDS,
  myCards: [],
  botCards: [],
  publicCards: [],

  reset: () => {
    set({
      cardDeck: INIT_GAME_CARDS,
      myCards: [],
      botCards: [],
      publicCards: [],
    });
  },
  dealToMe: (card: string) => {
    set({
      myCards: [...get().myCards, card],
      cardDeck: get().cardDeck.filter((id) => id !== card),
    });
  },
  sortPlayerCards: () => {
    set({
      myCards: get().myCards.sort(),
      botCards: get().botCards.sort(),
    });
  },
  dealToBot: (card: string) => {
    set({
      botCards: [...get().botCards, card],
      cardDeck: get().cardDeck.filter((id) => id !== card),
    });
  },
  dealToPublic: (card: string) => {
    set({
      publicCards: [...get().publicCards, card],
      cardDeck: get().cardDeck.filter((id) => id !== card),
    });
  },
  removeFromCardDeck: (card: string) => {
    set({ cardDeck: get().cardDeck.filter((id) => id !== card) });
  },
}));
