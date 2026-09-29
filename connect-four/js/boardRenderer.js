import { ROWS, COLS, EMPTY, HUMAN, AI } from "./constants.js";

const cellMap = new Map();

function cellKey(row, col) {
  return `${row}-${col}`;
}

function playerClass(player) {
  if (player === HUMAN) return "disc human";
  if (player === AI) return "disc ai";
  return "disc";
}

export function initBoard(container, onColumnSelect) {
  container.innerHTML = "";
  cellMap.clear();

  for (let col = 0; col < COLS; col++) {
    const columnEl = document.createElement("div");
    columnEl.className = "column";
    columnEl.dataset.col = String(col);
    columnEl.setAttribute("role", "button");
    columnEl.setAttribute("aria-label", `Column ${col + 1}`);

    for (let displayRow = ROWS - 1; displayRow >= 0; displayRow--) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = String(displayRow);
      cell.dataset.col = String(col);
      columnEl.appendChild(cell);
      cellMap.set(cellKey(displayRow, col), cell);
    }

    columnEl.addEventListener("click", () => onColumnSelect(col));
    container.appendChild(columnEl);
  }
}

export function renderBoard(board, winningCells = []) {
  const winSet = new Set(winningCells.map(([row, col]) => cellKey(row, col)));

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = cellMap.get(cellKey(row, col));
      if (!cell) continue;

      cell.innerHTML = "";
      cell.classList.remove("winning");

      const value = board[row][col];
      if (value !== EMPTY) {
        const disc = document.createElement("span");
        disc.className = playerClass(value);
        cell.appendChild(disc);
      }

      if (winSet.has(cellKey(row, col))) {
        cell.classList.add("winning");
      }
    }
  }
}

export function showHover(col, dropRow) {
  hideHover();
  if (dropRow === undefined || dropRow < 0) return;
  const cell = cellMap.get(cellKey(dropRow, col));
  if (!cell || cell.querySelector(".disc:not(.preview)")) return;

  const preview = document.createElement("span");
  preview.className = "disc human preview";
  cell.appendChild(preview);
}

export function hideHover() {
  document.querySelectorAll(".disc.preview").forEach((el) => el.remove());
}

export function animateDrop(board, row, col, player) {
  return new Promise((resolve) => {
    const cell = cellMap.get(cellKey(row, col));
    if (!cell) {
      resolve();
      return;
    }

    const disc = document.createElement("span");
    disc.className = `${playerClass(player)} dropping`;
    cell.appendChild(disc);

    const fallDistance = (ROWS - 1 - row) * 100;
    disc.style.setProperty("--fall-distance", `${fallDistance}%`);

    disc.addEventListener(
      "animationend",
      () => {
        disc.classList.remove("dropping");
        resolve();
      },
      { once: true }
    );
  });
}

export function setBoardDisabled(disabled) {
  document.querySelectorAll(".column").forEach((column) => {
    column.classList.toggle("disabled", disabled);
    column.setAttribute("aria-disabled", disabled ? "true" : "false");
  });
}

export function setColumnHoverHandler(getDropRow, canHover) {
  document.querySelectorAll(".column").forEach((column) => {
    const col = Number(column.dataset.col);
    column.addEventListener("mouseenter", () => {
      if (!canHover() || column.classList.contains("disabled")) return;
      showHover(col, getDropRow(col));
    });
    column.addEventListener("mouseleave", hideHover);
  });
}

export { HUMAN, AI };
