import { HUMAN, AI } from "./constants.js";

const statusEl = document.getElementById("status");
const humanScoreEl = document.getElementById("humanScore");
const aiScoreEl = document.getElementById("aiScore");
const drawScoreEl = document.getElementById("drawScore");
const humanIndicator = document.getElementById("humanIndicator");
const aiIndicator = document.getElementById("aiIndicator");

export function updateScores(scores) {
  humanScoreEl.textContent = String(scores.human);
  aiScoreEl.textContent = String(scores.ai);
  drawScoreEl.textContent = String(scores.draw);
}

export function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = "status" + (type ? ` ${type}` : "");
}

export function updateTurnIndicator(currentPlayer, gameOver, isThinking) {
  humanIndicator.classList.toggle("active", !gameOver && !isThinking && currentPlayer === HUMAN);
  aiIndicator.classList.toggle("active", !gameOver && (isThinking || currentPlayer === AI));
}

export function showThinking() {
  setStatus("AI is thinking…");
  updateTurnIndicator(AI, false, true);
}

export function showHumanTurn() {
  setStatus("Your turn — drop a red piece");
  updateTurnIndicator(HUMAN, false, false);
}

export function showGameOver(winner) {
  if (winner === HUMAN) {
    setStatus("You win!", "win");
  } else if (winner === AI) {
    setStatus("AI wins!", "lose");
  } else {
    setStatus("It's a draw!", "draw");
  }
  updateTurnIndicator(null, true, false);
}

export function resetStatus() {
  showHumanTurn();
}
