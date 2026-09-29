import { HUMAN, AI } from "./constants.js";
import {
  createGameState,
  dropPiece,
  getDropRow,
  isColumnFull,
  isBoardFull,
  resetBoard,
  resetScores,
} from "./gameState.js";
import { findWinFromMove } from "./winDetection.js";
import { chooseAIMove } from "./ai.js";
import {
  initBoard,
  renderBoard,
  animateDrop,
  setBoardDisabled,
  hideHover,
  setColumnHoverHandler,
} from "./boardRenderer.js";
import {
  updateScores,
  showThinking,
  showHumanTurn,
  showGameOver,
  resetStatus,
} from "./ui.js";

export function createGameController() {
  const state = createGameState();

  state.aiTimer = null;

  const boardContainer = document.getElementById("board");
  const difficultyEl = document.getElementById("difficulty");
  const newGameBtn = document.getElementById("newGame");
  const resetScoreBtn = document.getElementById("resetScore");

  function canHumanPlay() {
    return !state.gameOver && !state.isThinking && !state.isAnimating && state.currentPlayer === HUMAN;
  }

  function finishIfNeeded(row, col, player) {
    const win = findWinFromMove(state.board, row, col, player);
    if (win) {
      state.gameOver = true;
      state.winner = player;
      state.winningCells = win;
      if (player === HUMAN) state.scores.human += 1;
      else state.scores.ai += 1;
      updateScores(state.scores);
      renderBoard(state.board, state.winningCells);
      showGameOver(player);
      setBoardDisabled(true);
      return true;
    }

    if (isBoardFull(state.board)) {
      state.gameOver = true;
      state.winner = null;
      state.scores.draw += 1;
      updateScores(state.scores);
      showGameOver(null);
      setBoardDisabled(true);
      return true;
    }

    return false;
  }

  async function applyMove(col, player, animate = true) {
    const row = dropPiece(state.board, col, player);
    if (row === -1) return false;

    state.lastMove = { row, col, player };
    state.isAnimating = true;
    setBoardDisabled(true);
    hideHover();

    if (animate) {
      await animateDrop(state.board, row, col, player);
    }

    renderBoard(state.board, state.winningCells);
    state.isAnimating = false;

    if (finishIfNeeded(row, col, player)) return true;

    state.currentPlayer = player === HUMAN ? AI : HUMAN;
    return true;
  }

  function clearAiTimer() {
    if (state.aiTimer) {
      clearTimeout(state.aiTimer);
      state.aiTimer = null;
    }
  }

  function scheduleAiMove() {
    clearAiTimer();
    state.isThinking = true;
    showThinking();
    setBoardDisabled(true);

    state.aiTimer = setTimeout(async () => {
      state.aiTimer = null;
      if (state.gameOver) {
        state.isThinking = false;
        return;
      }

      const col = chooseAIMove(state.board, state.difficulty);
      state.isThinking = false;

      if (col === -1) return;

      await applyMove(col, AI, true);

      if (!state.gameOver) {
        state.currentPlayer = HUMAN;
        setBoardDisabled(false);
        showHumanTurn();
      }
    }, 450);
  }

  async function handleColumnSelect(col) {
    if (!canHumanPlay()) return;
    if (isColumnFull(state.board, col)) return;

    const moved = await applyMove(col, HUMAN, true);
    if (!moved || state.gameOver) return;

    scheduleAiMove();
  }

  function startNewGame() {
    clearAiTimer();
    resetBoard(state);
    state.difficulty = difficultyEl.value;
    hideHover();
    renderBoard(state.board);
    setBoardDisabled(false);
    resetStatus();
  }

  function handleResetScore() {
    resetScores(state);
    updateScores(state.scores);
    startNewGame();
  }

  function init() {
    resetBoard(state);
    updateScores(state.scores);
    initBoard(boardContainer, handleColumnSelect);
    setColumnHoverHandler(
      (col) => getDropRow(state.board, col),
      () => canHumanPlay()
    );
    renderBoard(state.board);
    resetStatus();

    newGameBtn.addEventListener("click", startNewGame);
    resetScoreBtn.addEventListener("click", handleResetScore);
    difficultyEl.addEventListener("change", startNewGame);
  }

  return { init, startNewGame };
}
