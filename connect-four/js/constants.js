export const ROWS = 6;
export const COLS = 7;
export const EMPTY = 0;
export const HUMAN = 1;
export const AI = 2;

export const PLAYER_NAMES = {
  [HUMAN]: "Human",
  [AI]: "AI",
};

export const DIFFICULTY_DEPTH = {
  easy: 3,
  medium: 5,
  hard: 7,
};

/** Center columns are more valuable in Connect Four. */
export const COLUMN_WEIGHTS = [3, 4, 5, 7, 5, 4, 3];

export const SCORE = {
  WIN: 1_000_000,
  LOSE: -1_000_000,
  FOUR: 100_000,
  THREE: 100,
  TWO: 10,
  ONE: 1,
};
