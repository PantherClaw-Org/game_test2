import { AI, HUMAN, DIFFICULTY_DEPTH } from "./constants.js";
import { getValidColumns } from "./gameState.js";
import { orderColumns } from "./evaluation.js";
import { getBestColumn, findWinningColumn } from "./minimax.js";

function pickRandomColumn(board) {
  const columns = getValidColumns(board);
  return columns[Math.floor(Math.random() * columns.length)] ?? -1;
}

/**
 * Select the AI move based on difficulty.
 * Easy uses shallow search and occasional randomness.
 * Medium and Hard use deeper minimax with alpha-beta pruning.
 */
export function chooseAIMove(board, difficulty) {
  const validColumns = getValidColumns(board);
  if (validColumns.length === 0) return -1;

  const winCol = findWinningColumn(board, AI);
  if (winCol !== -1) return winCol;

  const blockCol = findWinningColumn(board, HUMAN);
  if (blockCol !== -1) return blockCol;

  if (difficulty === "easy" && Math.random() < 0.35) {
    return pickRandomColumn(board);
  }

  const depth = DIFFICULTY_DEPTH[difficulty] ?? DIFFICULTY_DEPTH.medium;
  const bestCol = getBestColumn(board, depth, AI);

  if (bestCol !== -1) return bestCol;
  return orderColumns(validColumns)[0];
}
