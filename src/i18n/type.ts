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

  // game page
}

export type Translate = (key: keyof Translation) => string;
