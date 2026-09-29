const SIZE = 9;
const BOX = 3;
const MAX_MISTAKES = 3;
const CLUES = { easy: 42, medium: 34, hard: 26 };

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const livesEl = document.getElementById("lives");
const difficultyEl = document.getElementById("difficulty");
const newGameBtn = document.getElementById("newGame");
const numberPad = document.getElementById("numberPad");

let solution = Array(SIZE * SIZE).fill(0);
let puzzle = Array(SIZE * SIZE).fill(0);
let grid = Array(SIZE * SIZE).fill(0);
let given = Array(SIZE * SIZE).fill(false);
let selected = -1;
let mistakes = 0;
let gameOver = false;
let cells = [];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function idx(r, c) {
  return r * SIZE + c;
}

function isValid(board, pos, num) {
  const r = Math.floor(pos / SIZE);
  const c = pos % SIZE;
  for (let i = 0; i < SIZE; i++) {
    if (board[idx(r, i)] === num || board[idx(i, c)] === num) return false;
  }
  const br = Math.floor(r / BOX) * BOX;
  const bc = Math.floor(c / BOX) * BOX;
  for (let i = 0; i < BOX; i++) {
    for (let j = 0; j < BOX; j++) {
      if (board[idx(br + i, bc + j)] === num) return false;
    }
  }
  return true;
}

function findEmpty(board) {
  return board.indexOf(0);
}

function countSolutions(board, limit = 2) {
  let count = 0;
  const b = board.slice();

  function dfs() {
    if (count >= limit) return;
    const pos = findEmpty(b);
    if (pos === -1) {
      count += 1;
      return;
    }
    for (let n = 1; n <= 9; n++) {
      if (!isValid(b, pos, n)) continue;
      b[pos] = n;
      dfs();
      b[pos] = 0;
      if (count >= limit) return;
    }
  }

  dfs();
  return count;
}

function fillBoard() {
  const board = Array(SIZE * SIZE).fill(0);
  function fill(pos) {
    if (pos === SIZE * SIZE) return true;
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const n of nums) {
      if (!isValid(board, pos, n)) continue;
      board[pos] = n;
      if (fill(pos + 1)) return true;
      board[pos] = 0;
    }
    return false;
  }
  fill(0);
  return board;
}

function makePuzzle(clues) {
  const full = fillBoard();
  const board = full.slice();
  const order = shuffle([...Array(SIZE * SIZE).keys()]);
  let removed = 0;
  const targetRemove = SIZE * SIZE - clues;

  for (const pos of order) {
    if (removed >= targetRemove) break;
    const backup = board[pos];
    board[pos] = 0;
    if (countSolutions(board, 2) !== 1) {
      board[pos] = backup;
    } else {
      removed += 1;
    }
  }

  return { puzzle: board, solution: full };
}

function renderLives() {
  const left = Math.max(0, MAX_MISTAKES - mistakes);
  livesEl.textContent = "♥ ".repeat(left).trim() || "—";
}

function setStatus(msg, kind = "") {
  statusEl.textContent = msg;
  statusEl.className = "status" + (kind ? ` ${kind}` : "");
}

function highlight() {
  cells.forEach((cell, i) => {
    cell.classList.remove("selected", "related", "same-num");
    if (selected < 0) return;
    const sr = Math.floor(selected / SIZE);
    const sc = selected % SIZE;
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    const sameBox =
      Math.floor(r / BOX) === Math.floor(sr / BOX) &&
      Math.floor(c / BOX) === Math.floor(sc / BOX);
    if (i === selected) cell.classList.add("selected");
    else if (r === sr || c === sc || sameBox) cell.classList.add("related");
    if (grid[selected] && grid[i] === grid[selected]) cell.classList.add("same-num");
  });
}

function updatePad() {
  const counts = Array(10).fill(0);
  grid.forEach((n) => {
    if (n) counts[n] += 1;
  });
  numberPad.querySelectorAll(".num-btn").forEach((btn) => {
    const n = Number(btn.dataset.num);
    btn.disabled = gameOver || counts[n] >= 9;
  });
}

function buildBoard() {
  boardEl.innerHTML = "";
  cells = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sudoku-cell";
    btn.dataset.index = String(i);
    btn.setAttribute("role", "gridcell");
    btn.addEventListener("click", () => selectCell(i));
    boardEl.appendChild(btn);
    cells.push(btn);
  }
}

function paint() {
  cells.forEach((cell, i) => {
    const val = grid[i];
    cell.textContent = val || "";
    cell.classList.toggle("given", given[i]);
    cell.classList.toggle("user", !given[i] && val > 0);
    cell.classList.toggle("won", false);
    cell.classList.remove("error");
  });
  highlight();
  updatePad();
}

function selectCell(i) {
  if (gameOver) return;
  selected = i;
  highlight();
}

function placeNumber(num) {
  if (gameOver || selected < 0 || given[selected]) return;
  if (grid[selected] === num) return;

  if (num === solution[selected]) {
    grid[selected] = num;
    paint();
    if (grid.every((n, i) => n === solution[i])) {
      gameOver = true;
      cells.forEach((c) => c.classList.add("won"));
      setStatus("You solved it!", "win");
      updatePad();
    } else {
      setStatus("Nice — keep going");
    }
    return;
  }

  mistakes += 1;
  renderLives();
  const cell = cells[selected];
  cell.classList.add("error");
  cell.textContent = String(num);
  setTimeout(() => {
    cell.textContent = grid[selected] || "";
    cell.classList.remove("error");
  }, 350);

  if (mistakes >= MAX_MISTAKES) {
    gameOver = true;
    setStatus("Out of mistakes — you lose. Try a new puzzle.", "lose");
    updatePad();
  } else {
    setStatus(`Wrong — ${MAX_MISTAKES - mistakes} left`);
  }
}

function newGame() {
  const difficulty = difficultyEl.value;
  const clues = CLUES[difficulty] || CLUES.medium;
  setStatus("Generating puzzle…");
  requestAnimationFrame(() => {
    const { puzzle: p, solution: s } = makePuzzle(clues);
    puzzle = p;
    solution = s;
    grid = p.slice();
    given = p.map((n) => n > 0);
    selected = -1;
    mistakes = 0;
    gameOver = false;
    renderLives();
    paint();
    setStatus("Select a cell, then enter 1–9");
  });
}

numberPad.addEventListener("click", (e) => {
  const btn = e.target.closest(".num-btn");
  if (!btn || btn.disabled) return;
  placeNumber(Number(btn.dataset.num));
});

document.addEventListener("keydown", (e) => {
  if (gameOver) return;
  if (e.key >= "1" && e.key <= "9") {
    placeNumber(Number(e.key));
    return;
  }
  if (selected < 0) return;
  const r = Math.floor(selected / SIZE);
  const c = selected % SIZE;
  if (e.key === "ArrowUp" && r > 0) selectCell(idx(r - 1, c));
  if (e.key === "ArrowDown" && r < 8) selectCell(idx(r + 1, c));
  if (e.key === "ArrowLeft" && c > 0) selectCell(idx(r, c - 1));
  if (e.key === "ArrowRight" && c < 8) selectCell(idx(r, c + 1));
});

difficultyEl.addEventListener("change", newGame);
newGameBtn.addEventListener("click", newGame);

buildBoard();
newGame();
