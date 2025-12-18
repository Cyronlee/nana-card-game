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
  PLAY_AGAINST_BOTS: string;
  GAME_SETTINGS: string;
  SELECT_BOT_COUNT: string;
  BOT_COUNT_1: string;
  BOT_COUNT_2: string;
  BOT_COUNT_3: string;
  BOT_COUNT_4: string;
  BOT_COUNT_5: string;
  GAME_CONFIG: string;
  NUMBERS_USED: string;
  HAND_CARDS: string;
  PUBLIC_CARDS: string;
  CARDS_UNIT: string;
  BACK: string;
  START_GAME: string;
  FLIP_CARD_1: string;
  FLIP_CARD_2: string;
  FLIP_CARD_3: string;
  PUBLIC_AREA: string;
  SELECT_MIN: string;
  SELECT_MAX: string;
  NO_HAND_CARDS: string;
  ME: string;
  MY_TURN: string;
  BOT_TURN: string;
  CHALLENGE_SUCCESS: string;
  CHALLENGE_FAILED: string;
  WINS: string;
  GAME_OVER: string;
  RESTART: string;
  BACK_HOME: string;
  WAIT_YOUR_TURN: string;

  // game page
}

export type Translate = (key: keyof Translation) => string;
