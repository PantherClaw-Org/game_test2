const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const statusEl = document.getElementById("status");
const resetRoundBtn = document.getElementById("resetRound");
const resetAllBtn = document.getElementById("resetAll");
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const scoreDrawEl = document.getElementById("scoreDraw");
const labelXEl = document.getElementById("labelX");
const labelOEl = document.getElementById("labelO");
const gameModeEl = document.getElementById("gameMode");
const difficultyEl = document.getElementById("difficulty");
const difficultyGroupEl = document.getElementById("difficultyGroup");
const cells = [...document.querySelectorAll(".cell")];

let board = Array(9).fill(null);
let currentPlayer = "X";
let humanSymbol = "X";
let cpuSymbol = "O";
let gameOver = false;
let isThinking = false;
let gameMode = "pvp";
let difficulty = "medium";
let scores = { X: 0, O: 0, draw: 0 };

function updateSymbols() {
  if (gameMode === "cpu" && difficulty === "insane") {
    humanSymbol = "O";
    cpuSymbol = "X";
  } else if (gameMode === "cpu") {
    humanSymbol = "X";
    cpuSymbol = "O";
  }
}

function cpuGoesFirst() {
  return gameMode === "cpu" && difficulty === "insane";
}

function getThinkDelay() {
  return difficulty === "insane" ? 200 : 450;
}

function updateScoreLabels() {
  if (gameMode === "cpu") {
    labelXEl.textContent = cpuSymbol === "X" ? "CPU" : "You";
    labelOEl.textContent = cpuSymbol === "O" ? "CPU" : "You";
  } else {
    labelXEl.textContent = "X";
    labelOEl.textContent = "O";
  }
}

function getTurnMessage(player) {
  if (gameMode === "cpu") {
    if (player === humanSymbol) return "Your turn";
    if (difficulty === "insane") return "CPU is calculating…";
    return "Computer is thinking…";
  }
  return `Player ${player}'s turn`;
}

function getWinMessage(winner) {
  if (gameMode === "cpu") {
    if (winner === humanSymbol) return "You win!";
    if (winner === cpuSymbol) return "Computer wins!";
  }
  return `Player ${winner} wins!`;
}

function updateStatus(message) {
  statusEl.textContent = message;
}

function checkWinner(state = board) {
  for (const [a, b, c] of WIN_LINES) {
    if (state[a] && state[a] === state[b] && state[a] === state[c]) {
      return { winner: state[a], line: [a, b, c] };
    }
  }
  if (state.every(Boolean)) {
    return { winner: null, line: null, draw: true };
  }
  return null;
}

function getEmptyCells(state = board) {
  return state.reduce((acc, cell, index) => {
    if (!cell) acc.push(index);
    return acc;
  }, []);
}

function applyMove(index, player) {
  board[index] = player;
  const cell = cells[index];
  cell.textContent = player;
  cell.classList.add(player.toLowerCase(), "pop");
  cell.disabled = true;
}

function finishGame(result) {
  gameOver = true;
  if (result.draw) {
    scores.draw += 1;
    scoreDrawEl.textContent = scores.draw;
    updateStatus("It's a draw!");
  } else {
    scores[result.winner] += 1;
    document.getElementById(`score${result.winner}`).textContent = scores[result.winner];
    result.line.forEach((i) => cells[i].classList.add("win"));
    updateStatus(getWinMessage(result.winner));
  }
  cells.forEach((c) => (c.disabled = true));
}

function switchPlayer() {
  return currentPlayer === humanSymbol ? cpuSymbol : humanSymbol;
}

function setBoardInteraction(enabled) {
  cells.forEach((cell) => {
    if (!cell.textContent) cell.disabled = !enabled;
  });
}

function randomMove(state = board) {
  const empty = getEmptyCells(state);
  return empty[Math.floor(Math.random() * empty.length)];
}

function findWinningMove(state, player) {
  for (const index of getEmptyCells(state)) {
    const next = [...state];
    next[index] = player;
    if (checkWinner(next)?.winner === player) return index;
  }
  return null;
}

function getMediumMove() {
  const win = findWinningMove(board, cpuSymbol);
  if (win !== null && Math.random() < 0.85) return win;
  const block = findWinningMove(board, humanSymbol);
  if (block !== null && Math.random() < 0.85) return block;
  if (Math.random() < 0.4) return randomMove();
  const preferred = [4, 0, 2, 6, 8, 1, 3, 5, 7].filter((i) => !board[i]);
  return preferred[0] ?? randomMove();
}

function minimax(state, player, ai, human, depth = 0) {
  const result = checkWinner(state);
  if (result?.winner === ai) return 10 - depth;
  if (result?.winner === human) return depth - 10;
  if (result?.draw) return 0;

  const empty = getEmptyCells(state);
  if (player === ai) {
    let best = -Infinity;
    for (const index of empty) {
      const next = [...state];
      next[index] = ai;
      best = Math.max(best, minimax(next, human, ai, human, depth + 1));
    }
    return best;
  }

  let best = Infinity;
  for (const index of empty) {
    const next = [...state];
    next[index] = human;
    best = Math.min(best, minimax(next, ai, ai, human, depth + 1));
  }
  return best;
}

function getBestMove(state = board) {
  let bestScore = -Infinity;
  let bestMove = getEmptyCells(state)[0];
  for (const index of getEmptyCells(state)) {
    const next = [...state];
    next[index] = cpuSymbol;
    const score = minimax(next, humanSymbol, cpuSymbol, humanSymbol);
    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }
  return bestMove;
}

function getComputerMove() {
  if (difficulty === "easy") return randomMove();
  if (difficulty === "hard" || difficulty === "insane") return getBestMove();
  return getMediumMove();
}

function playMove(index, player) {
  applyMove(index, player);
  const result = checkWinner();
  if (result) {
    finishGame(result);
    return true;
  }
  return false;
}

function handleCellClick(index) {
  if (gameOver || isThinking || board[index]) return;
  if (gameMode === "cpu" && currentPlayer === cpuSymbol) return;
  if (playMove(index, currentPlayer)) return;
  currentPlayer = switchPlayer();
  updateStatus(getTurnMessage(currentPlayer));
  if (gameMode === "cpu" && currentPlayer === cpuSymbol) scheduleComputerMove();
}

function scheduleComputerMove() {
  isThinking = true;
  setBoardInteraction(false);
  updateStatus(getTurnMessage(cpuSymbol));
  setTimeout(() => {
    if (gameOver) {
      isThinking = false;
      return;
    }
    playMove(getComputerMove(), cpuSymbol);
    if (!gameOver) {
      currentPlayer = humanSymbol;
      updateStatus(getTurnMessage(humanSymbol));
      setBoardInteraction(true);
    }
    isThinking = false;
  }, getThinkDelay());
}

function resetRound() {
  updateSymbols();
  board = Array(9).fill(null);
  gameOver = false;
  isThinking = false;
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.disabled = false;
    cell.className = "cell";
  });
  currentPlayer = cpuGoesFirst() ? cpuSymbol : humanSymbol;
  updateScoreLabels();
  if (gameMode === "cpu" && currentPlayer === cpuSymbol) {
    updateStatus(getTurnMessage(cpuSymbol));
    scheduleComputerMove();
  } else {
    updateStatus(getTurnMessage(currentPlayer));
  }
}

function resetAll() {
  scores = { X: 0, O: 0, draw: 0 };
  scoreXEl.textContent = "0";
  scoreOEl.textContent = "0";
  scoreDrawEl.textContent = "0";
  resetRound();
}

cells.forEach((cell) => {
  cell.addEventListener("click", () => handleCellClick(Number(cell.dataset.index)));
});

resetRoundBtn.addEventListener("click", resetRound);
resetAllBtn.addEventListener("click", resetAll);
gameModeEl.addEventListener("change", () => {
  gameMode = gameModeEl.value;
  difficultyGroupEl.hidden = gameMode !== "cpu";
  resetRound();
});
difficultyEl.addEventListener("change", () => {
  difficulty = difficultyEl.value;
  resetRound();
});

updateSymbols();
updateScoreLabels();
resetRound();
