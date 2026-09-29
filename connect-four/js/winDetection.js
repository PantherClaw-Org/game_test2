import { ROWS, COLS } from "./constants.js";

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

function inBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

/** Returns exactly four winning cell coordinates after the last move, if any. */
export function findWinFromMove(board, row, col, player) {
  if (!inBounds(row, col) || board[row][col] !== player) return null;

  for (const [dr, dc] of DIRECTIONS) {
    const line = [[row, col]];

    for (let step = 1; step < 4; step++) {
      const r = row - dr * step;
      const c = col - dc * step;
      if (!inBounds(r, c) || board[r][c] !== player) break;
      line.unshift([r, c]);
    }

    for (let step = 1; step < 4; step++) {
      const r = row + dr * step;
      const c = col + dc * step;
      if (!inBounds(r, c) || board[r][c] !== player) break;
      line.push([r, c]);
    }

    if (line.length >= 4) {
      return line.slice(0, 4);
    }
  }

  return null;
}
