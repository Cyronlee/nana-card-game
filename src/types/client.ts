export interface GameState {
  gameStage: GameStage;
  gameSubStage: GameSubStage;
  cardDeck: Card[];
  publicCards: Card[];
  players: Player[];
  // myCards: string[];
  // botCards: string[];
}

export interface Card {
  id: string;
  number: number;
  isRevealed: boolean;
}

export interface Player {
  id: string;
  name: string;
  isMe: boolean;
  isPlaying: boolean;
  hand: Card[];
  collection: Card[];
}

export type GameStage = "seat" | "in-game" | "game-over";
export type GameSubStage = "my-turn" | "bot-turn" | "win" | "loose" | undefined;
