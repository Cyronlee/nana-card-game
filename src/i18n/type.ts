export interface Translation {
  // global
  HTML_TITLE: string;

  // lobby page
  NANA_GAME_TITLE: string;
  NANA_GAME_DESCRIPTION: string;
  CREATE_GAME: string;
  JOIN_GAME: string;
  YOUR_NAME: string;
  GAME_ID: string;

  // single player mode
  SINGLE_PLAYER_MODE: string;
  SINGLE_PLAYER_DESCRIPTION: string;
  START_SINGLE_PLAYER: string;
  SELECT_BOT_COUNT: string;
  GAME_CONFIG: string;
  NUMBERS_USED: string;
  HAND_CARDS: string;
  PUBLIC_CARDS: string;
  MY_TURN: string;
  BOT_TURN: string;
  CHALLENGE_SUCCESS: string;
  CHALLENGE_FAILED: string;
  GAME_OVER: string;
  RESTART: string;
  BACK_HOME: string;

  // game page
}

export type Translate = (key: keyof Translation) => string;
