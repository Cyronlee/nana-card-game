import { GameStage, GameSubStage } from "@/types/client";

export interface ServerGameState {
  gameStage: GameStage;
  gameSubStage: GameSubStage;
  cardDeck: Card[];
  publicCards: Card[];
  players: Player[];
}

export interface Card {
  id: string;
  number: number;
  isRevealed: boolean;
}

export interface Player {
  id: string;
  name: string;
  isPlaying: boolean;
  hand: Card[];
  collection: Card[];
}
