import { AI, HUMAN, SCORE } from "./constants.js";
import {
  dropPiece,
  undoDrop,
  getValidColumns,
  isBoardFull,
} from "./gameState.js";
import { findWinFromMove } from "./winDetection.js";
import { evaluateBoard, orderColumns } from "./evaluation.js";

/**
 * Minimax with alpha-beta pruning.
 * At each node we either maximize (AI) or minimize (Human) the heuristic score.
 * Alpha-beta skips branches that cannot affect the final decision.
 */
export function minimax(board, depth, alpha, beta, maximizingPlayer, aiPlayer = AI) {
  const humanPlayer = aiPlayer === AI ? HUMAN : AI;

  for (let col = 0; col < board[0].length; col++) {
    for (let row = 0; row < board.length; row++) {
      const player = board[row][col];
      if (!player) continue;
      const win = findWinFromMove(board, row, col, player);
      if (win) {
        return player === aiPlayer
          ? SCORE.WIN + depth
          : SCORE.LOSE - depth;
      }
    }
  }

  if (isBoardFull(board) || depth === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  const validColumns = orderColumns(getValidColumns(board));

  if (maximizingPlayer) {
    let value = -Infinity;

    for (const col of validColumns) {
      const row = dropPiece(board, col, aiPlayer);
      if (row === -1) continue;

      const childScore = minimax(board, depth - 1, alpha, beta, false, aiPlayer);
      undoDrop(board, row, col);

      value = Math.max(value, childScore);
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }

    return value;
  }

  let value = Infinity;

  for (const col of validColumns) {
    const row = dropPiece(board, col, humanPlayer);
    if (row === -1) continue;

    const childScore = minimax(board, depth - 1, alpha, beta, true, aiPlayer);
    undoDrop(board, row, col);

    value = Math.min(value, childScore);
    beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }

  return value;
}

/**
 * Choose the AI column by searching with minimax + alpha-beta.
 * Returns the column index with the highest minimax score.
 */
export function getBestColumn(board, depth, aiPlayer = AI) {
  let bestCol = orderColumns(getValidColumns(board))[0] ?? -1;
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const col of orderColumns(getValidColumns(board))) {
    const row = dropPiece(board, col, aiPlayer);
    if (row === -1) continue;

    const score = minimax(board, depth - 1, alpha, beta, false, aiPlayer);
    undoDrop(board, row, col);

    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
    alpha = Math.max(alpha, bestScore);
  }

  return bestCol;
}

export function findWinningColumn(board, player) {
  for (const col of getValidColumns(board)) {
    const row = dropPiece(board, col, player);
    if (row === -1) continue;
    const win = findWinFromMove(board, row, col, player);
    undoDrop(board, row, col);
    if (win) return col;
  }
  return -1;
}
