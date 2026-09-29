import {
  ROWS,
  COLS,
  HUMAN,
  AI,
  COLUMN_WEIGHTS,
  SCORE,
} from "./constants.js";

function scoreWindow(cells, player, opponent) {
  let playerCount = 0;
  let opponentCount = 0;
  let emptyCount = 0;

  for (const cell of cells) {
    if (cell === player) playerCount += 1;
    else if (cell === opponent) opponentCount += 1;
    else emptyCount += 1;
  }

  if (playerCount > 0 && opponentCount > 0) return 0;
  if (playerCount === 4) return SCORE.FOUR;
  if (playerCount === 3 && emptyCount === 1) return SCORE.THREE;
  if (playerCount === 2 && emptyCount === 2) return SCORE.TWO;
  if (playerCount === 1 && emptyCount === 3) return SCORE.ONE;
  if (opponentCount === 3 && emptyCount === 1) return -SCORE.THREE * 1.2;
  if (opponentCount === 2 && emptyCount === 2) return -SCORE.TWO;
  return 0;
}

function evaluateDirection(board, player) {
  const opponent = player === HUMAN ? AI : HUMAN;
  let total = 0;

  const addWindow = (cells) => {
    total += scoreWindow(cells, player, opponent);
  };

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      addWindow([board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]]);
    }
  }

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row <= ROWS - 4; row++) {
      addWindow([board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]]);
    }
  }

  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      addWindow([
        board[row][col],
        board[row + 1][col + 1],
        board[row + 2][col + 2],
        board[row + 3][col + 3],
      ]);
    }
  }

  for (let row = 3; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      addWindow([
        board[row][col],
        board[row - 1][col + 1],
        board[row - 2][col + 2],
        board[row - 3][col + 3],
      ]);
    }
  }

  return total;
}

/**
 * Heuristic board evaluation from the AI perspective.
 * Positive scores favor the AI; negative scores favor the human.
 */
export function evaluateBoard(board, player = AI) {
  const opponent = player === HUMAN ? AI : HUMAN;
  let score = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] === player) score += COLUMN_WEIGHTS[col];
      if (board[row][col] === opponent) score -= COLUMN_WEIGHTS[col];
    }
  }

  score += evaluateDirection(board, player);
  score -= evaluateDirection(board, opponent) * 0.9;
  return score;
}

export function orderColumns(columns) {
  return [...columns].sort((a, b) => COLUMN_WEIGHTS[b] - COLUMN_WEIGHTS[a]);
}
