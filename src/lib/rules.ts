import { Card } from "@/types";
const ALL_CARD_IDS = [
  "1-a",
  "1-b",
  "1-c",
  "2-a",
  "2-b",
  "2-c",
  "3-a",
  "3-b",
  "3-c",
  "4-a",
  "4-b",
  "4-c",
  "5-a",
  "5-b",
  "5-c",
  "6-a",
  "6-b",
  "6-c",
  "7-a",
  "7-b",
  "7-c",
  "8-a",
  "8-b",
  "8-c",
  "9-a",
  "9-b",
  "9-c",
  "10-a",
  "10-b",
  "10-c",
  "11-a",
  "11-b",
  "11-c",
  "12-a",
  "12-b",
  "12-c",
];

export const ALL_CARDS: Card[] = ALL_CARD_IDS.map((id) => ({
  id: id,
  number: id.split("-")[0] as unknown as number,
  isRevealed: false,
}));

interface GameRules {
  [key: number]: {
    cards: Card[];
    handNumber: number;
    publicNumber: number;
  };
}

export const GAME_RULES: GameRules = {
  2: {
    cards: [...ALL_CARDS].filter((c) => c.number != 11 && c.number != 12),
    handNumber: 10,
    publicNumber: 10,
  },
  3: {
    cards: [...ALL_CARDS].filter((c) => c.number != 12),
    handNumber: 8,
    publicNumber: 9,
  },
  4: {
    cards: [...ALL_CARDS],
    handNumber: 7,
    publicNumber: 8,
  },
  5: {
    cards: [...ALL_CARDS],
    handNumber: 6,
    publicNumber: 6,
  },
  6: {
    cards: [...ALL_CARDS],
    handNumber: 5,
    publicNumber: 6,
  },
};

export const sum7Pairs: number[][] = [
  [1, 6],
  [2, 5],
  [3, 4],
  [8, 1],
  [9, 2],
  [10, 3],
  [11, 4],
  [12, 5],
];
