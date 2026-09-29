import { ROWS, COLS, EMPTY, HUMAN } from "./constants.js";

export function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

/** Row 0 is the bottom; pieces fall into the lowest empty row in a column. */
export function getDropRow(board, col) {
  if (col < 0 || col >= COLS) return -1;
  for (let row = 0; row < ROWS; row++) {
    if (board[row][col] === EMPTY) return row;
  }
  return -1;
}

export function dropPiece(board, col, player) {
  const row = getDropRow(board, col);
  if (row === -1) return -1;
  board[row][col] = player;
  return row;
}

export function undoDrop(board, row, col) {
  board[row][col] = EMPTY;
}

export function isColumnFull(board, col) {
  return board[ROWS - 1][col] !== EMPTY;
}

export function getValidColumns(board) {
  const columns = [];
  for (let col = 0; col < COLS; col++) {
    if (!isColumnFull(board, col)) columns.push(col);
  }
  return columns;
}

export function isBoardFull(board) {
  return getValidColumns(board).length === 0;
}

export function createGameState() {
  return {
    board: createEmptyBoard(),
    currentPlayer: HUMAN,
    gameOver: false,
    winner: null,
    winningCells: [],
    isThinking: false,
    isAnimating: false,
    difficulty: "medium",
    scores: { human: 0, ai: 0, draw: 0 },
    lastMove: null,
  };
}

export function resetBoard(state) {
  state.board = createEmptyBoard();
  state.currentPlayer = HUMAN;
  state.gameOver = false;
  state.winner = null;
  state.winningCells = [];
  state.isThinking = false;
  state.isAnimating = false;
  state.lastMove = null;
}

export function resetScores(state) {
  state.scores = { human: 0, ai: 0, draw: 0 };
}
