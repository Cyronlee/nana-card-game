export type GameStagePrefix = `stage:${string}`;
export type SubStagePrefix = `sub:${string}`;
export type ActionPrefix = `action:${string}`;

export interface ServerState {
  gameId: string;
  gameStage: GameStagePrefix;
  gameSubStage?: SubStagePrefix | null;
  timestamp: number;
  players: Player[];
  cardDeck?: Card[];
  publicCards?: Card[];
  messages: Message[];
}

export interface Player {
  id: string;
  name: string;
  seat: number;
  isHost?: boolean;
  isWinner?: boolean;
  isPlaying?: boolean;
  hand: Card[];
  collection: Card[];
}

export interface Card {
  id: string;
  number: number;
  isRevealed: boolean;
}

export interface Action {
  gameId: string;
  playerId: string;
  action: ActionPrefix;
  data?: any;
}

export interface LocalPlayerInfo {
  id: string;
  name: string;
}

export interface Message {
  playerName: string;
  timestamp: number;
  content: string;
}
