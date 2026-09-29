(function () {
  "use strict";

  // --- constants.js ---
  const ROWS = 6;
  const COLS = 7;
  const EMPTY = 0;
  const HUMAN = 1;
  const AI = 2;
  const DIFFICULTY_DEPTH = { easy: 3, medium: 5, hard: 7 };
  const COLUMN_WEIGHTS = [3, 4, 5, 7, 5, 4, 3];
  const SCORE = { WIN: 1_000_000, LOSE: -1_000_000, FOUR: 100_000, THREE: 100, TWO: 10, ONE: 1 };

  // --- gameState.js ---
  function createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
  }

  function getDropRow(board, col) {
    if (col < 0 || col >= COLS) return -1;
    for (let row = 0; row < ROWS; row++) {
      if (board[row][col] === EMPTY) return row;
    }
    return -1;
  }

  function dropPiece(board, col, player) {
    const row = getDropRow(board, col);
    if (row === -1) return -1;
    board[row][col] = player;
    return row;
  }

  function undoDrop(board, row, col) {
    board[row][col] = EMPTY;
  }

  function isColumnFull(board, col) {
    return board[ROWS - 1][col] !== EMPTY;
  }

  function getValidColumns(board) {
    const columns = [];
    for (let col = 0; col < COLS; col++) {
      if (!isColumnFull(board, col)) columns.push(col);
    }
    return columns;
  }

  function isBoardFull(board) {
    return getValidColumns(board).length === 0;
  }

  function createGameState() {
    return {
      board: createEmptyBoard(),
      currentPlayer: HUMAN,
      gameOver: false,
      winner: null,
      winningCells: [],
      isThinking: false,
      isAnimating: false,
      gameMode: "cpu",
      difficulty: "medium",
      scores: { human: 0, ai: 0, draw: 0 },
      lastMove: null,
      aiTimer: null,
    };
  }

  function resetBoard(state) {
    state.board = createEmptyBoard();
    state.currentPlayer = HUMAN;
    state.gameOver = false;
    state.winner = null;
    state.winningCells = [];
    state.isThinking = false;
    state.isAnimating = false;
    state.lastMove = null;
  }

  function resetScores(state) {
    state.scores = { human: 0, ai: 0, draw: 0 };
  }

  // --- winDetection.js ---
  const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];

  function findWinFromMove(board, row, col, player) {
    for (const [dr, dc] of DIRECTIONS) {
      const line = [[row, col]];

      for (let step = 1; step < 4; step++) {
        const r = row - dr * step;
        const c = col - dc * step;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
        line.unshift([r, c]);
      }

      for (let step = 1; step < 4; step++) {
        const r = row + dr * step;
        const c = col + dc * step;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
        line.push([r, c]);
      }

      if (line.length >= 4) return line.slice(0, 4);
    }
    return null;
  }

  // --- evaluation.js ---
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
    const addWindow = (cells) => { total += scoreWindow(cells, player, opponent); };

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
        addWindow([board[row][col], board[row + 1][col + 1], board[row + 2][col + 2], board[row + 3][col + 3]]);
      }
    }
    for (let row = 3; row < ROWS; row++) {
      for (let col = 0; col <= COLS - 4; col++) {
        addWindow([board[row][col], board[row - 1][col + 1], board[row - 2][col + 2], board[row - 3][col + 3]]);
      }
    }
    return total;
  }

  /** Heuristic score from the AI perspective. */
  function evaluateBoard(board, player = AI) {
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

  function orderColumns(columns) {
    return [...columns].sort((a, b) => COLUMN_WEIGHTS[b] - COLUMN_WEIGHTS[a]);
  }

  // --- minimax.js (alpha-beta pruning) ---
  function minimax(board, depth, alpha, beta, maximizingPlayer, aiPlayer = AI) {
    const humanPlayer = aiPlayer === AI ? HUMAN : AI;

    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const player = board[row][col];
        if (!player) continue;
        if (findWinFromMove(board, row, col, player)) {
          return player === aiPlayer ? SCORE.WIN + depth : SCORE.LOSE - depth;
        }
      }
    }

    if (isBoardFull(board) || depth === 0) return evaluateBoard(board, aiPlayer);

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

  function getBestColumn(board, depth, aiPlayer = AI) {
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

  function findWinningColumn(board, player) {
    for (const col of getValidColumns(board)) {
      const row = dropPiece(board, col, player);
      if (row === -1) continue;
      const win = findWinFromMove(board, row, col, player);
      undoDrop(board, row, col);
      if (win) return col;
    }
    return -1;
  }

  // --- ai.js ---
  function chooseAIMove(board, difficulty) {
    const validColumns = getValidColumns(board);
    if (validColumns.length === 0) return -1;

    const winCol = findWinningColumn(board, AI);
    if (winCol !== -1) return winCol;

    const blockCol = findWinningColumn(board, HUMAN);
    if (blockCol !== -1) return blockCol;

    if (difficulty === "easy" && Math.random() < 0.35) {
      return validColumns[Math.floor(Math.random() * validColumns.length)];
    }

    const depth = DIFFICULTY_DEPTH[difficulty] ?? DIFFICULTY_DEPTH.medium;
    const bestCol = getBestColumn(board, depth, AI);
    return bestCol !== -1 ? bestCol : orderColumns(validColumns)[0];
  }

  // --- boardRenderer.js ---
  const cellMap = new Map();

  function cellKey(row, col) {
    return `${row}-${col}`;
  }

  function playerClass(player) {
    if (player === HUMAN) return "disc human";
    if (player === AI) return "disc ai";
    return "disc";
  }

  function initBoard(container, onColumnSelect) {
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

  function renderBoard(board, winningCells = []) {
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

        if (winSet.has(cellKey(row, col))) cell.classList.add("winning");
      }
    }
  }

  function showHover(col, dropRow, player = HUMAN) {
    hideHover();
    if (dropRow < 0) return;
    const cell = cellMap.get(cellKey(dropRow, col));
    if (!cell || cell.querySelector(".disc:not(.preview)")) return;
    const preview = document.createElement("span");
    preview.className = `${playerClass(player)} preview`;
    cell.appendChild(preview);
  }

  function hideHover() {
    document.querySelectorAll(".disc.preview").forEach((el) => el.remove());
  }

  function animateDrop(row, col, player) {
    return new Promise((resolve) => {
      const cell = cellMap.get(cellKey(row, col));
      if (!cell) {
        resolve();
        return;
      }

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      const disc = document.createElement("span");
      disc.className = `${playerClass(player)} dropping`;
      cell.appendChild(disc);

      const fallDistance = (ROWS - 1 - row) * 100;
      disc.style.setProperty("--fall-distance", `${fallDistance}%`);

      disc.addEventListener("animationend", () => {
        disc.classList.remove("dropping");
        finish();
      }, { once: true });

      setTimeout(finish, 500);
    });
  }

  function setBoardDisabled(disabled) {
    document.querySelectorAll(".column").forEach((column) => {
      column.classList.toggle("disabled", disabled);
      column.setAttribute("aria-disabled", disabled ? "true" : "false");
    });
  }

  function setColumnHoverHandler(getDropRowFn, canHover, getPreviewPlayer) {
    document.querySelectorAll(".column").forEach((column) => {
      const col = Number(column.dataset.col);

      const onEnter = () => {
        if (!canHover() || column.classList.contains("disabled")) return;
        column.classList.add("hover-col");
        showHover(col, getDropRowFn(col), getPreviewPlayer());
      };

      const onLeave = () => {
        column.classList.remove("hover-col");
        hideHover();
      };

      column.addEventListener("mouseenter", onEnter);
      column.addEventListener("mouseleave", onLeave);
      column.addEventListener("touchstart", onEnter, { passive: true });
      column.addEventListener("touchend", onLeave);
    });
  }

  // --- gameController / ui ---
  const state = createGameState();
  const boardContainer = document.getElementById("board");
  const gameModeEl = document.getElementById("gameMode");
  const difficultyEl = document.getElementById("difficulty");
  const difficultyGroupEl = document.getElementById("difficultyGroup");
  const newGameBtn = document.getElementById("newGame");
  const resetScoreBtn = document.getElementById("resetScore");
  const statusEl = document.getElementById("status");
  const humanScoreEl = document.getElementById("humanScore");
  const aiScoreEl = document.getElementById("aiScore");
  const drawScoreEl = document.getElementById("drawScore");
  const humanIndicator = document.getElementById("humanIndicator");
  const aiIndicator = document.getElementById("aiIndicator");
  const humanLabelEl = document.getElementById("humanLabel");
  const aiLabelEl = document.getElementById("aiLabel");
  const scoreLabelHumanEl = document.getElementById("scoreLabelHuman");
  const scoreLabelAiEl = document.getElementById("scoreLabelAi");

  function isPvp() {
    return state.gameMode === "pvp";
  }

  function updateModeLabels() {
    if (isPvp()) {
      humanLabelEl.textContent = "Player 1 (Red)";
      aiLabelEl.textContent = "Player 2 (Yellow)";
      scoreLabelHumanEl.textContent = "P1";
      scoreLabelAiEl.textContent = "P2";
    } else {
      humanLabelEl.textContent = "You (Red)";
      aiLabelEl.textContent = "AI (Yellow)";
      scoreLabelHumanEl.textContent = "You";
      scoreLabelAiEl.textContent = "AI";
    }
  }

  function updateScores(scores) {
    humanScoreEl.textContent = String(scores.human);
    aiScoreEl.textContent = String(scores.ai);
    drawScoreEl.textContent = String(scores.draw);
  }

  function setStatus(message, type = "") {
    statusEl.textContent = message;
    statusEl.className = "status" + (type ? ` ${type}` : "");
  }

  function updateTurnIndicator(currentPlayer, gameOver, isThinking) {
    humanIndicator.classList.toggle("active", !gameOver && !isThinking && currentPlayer === HUMAN);
    aiIndicator.classList.toggle("active", !gameOver && (isThinking || currentPlayer === AI));
  }

  function showThinking() {
    setStatus("AI is thinking…");
    updateTurnIndicator(AI, false, true);
  }

  function showCurrentTurn() {
    if (isPvp()) {
      if (state.currentPlayer === HUMAN) {
        setStatus("Player 1 (Red) — click a column");
      } else {
        setStatus("Player 2 (Yellow) — click a column");
      }
    } else {
      setStatus("Click a column — your red piece drops to the bottom");
    }
    updateTurnIndicator(state.currentPlayer, false, false);
  }

  function showGameOver(winner) {
    if (winner === HUMAN) {
      setStatus(isPvp() ? "Player 1 (Red) wins!" : "You win!", "win");
    } else if (winner === AI) {
      setStatus(isPvp() ? "Player 2 (Yellow) wins!" : "AI wins!", "lose");
    } else {
      setStatus("It's a draw!", "draw");
    }
    updateTurnIndicator(null, true, false);
  }

  function canPlay() {
    if (state.gameOver || state.isThinking || state.isAnimating) return false;
    if (isPvp()) return true;
    return state.currentPlayer === HUMAN;
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

    if (animate) await animateDrop(row, col, player);

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
        showCurrentTurn();
      }
    }, 450);
  }

  async function handleColumnSelect(col) {
    if (!canPlay()) return;
    if (isColumnFull(state.board, col)) {
      setStatus("That column is full — pick another");
      return;
    }

    const player = state.currentPlayer;
    const moved = await applyMove(col, player, true);
    if (!moved || state.gameOver) return;

    if (isPvp()) {
      setBoardDisabled(false);
      showCurrentTurn();
      return;
    }

    scheduleAiMove();
  }

  function syncModeUi() {
    state.gameMode = gameModeEl.value;
    difficultyGroupEl.hidden = isPvp();
    updateModeLabels();
  }

  function startNewGame() {
    clearAiTimer();
    resetBoard(state);
    syncModeUi();
    state.difficulty = difficultyEl.value;
    hideHover();
    renderBoard(state.board);
    setBoardDisabled(false);
    showCurrentTurn();
  }

  function handleResetScore() {
    resetScores(state);
    updateScores(state.scores);
    startNewGame();
  }

  resetBoard(state);
  syncModeUi();
  updateScores(state.scores);
  initBoard(boardContainer, handleColumnSelect);
  setColumnHoverHandler(
    (col) => getDropRow(state.board, col),
    () => canPlay(),
    () => state.currentPlayer
  );
  renderBoard(state.board);
  showCurrentTurn();

  newGameBtn.addEventListener("click", startNewGame);
  resetScoreBtn.addEventListener("click", handleResetScore);
  gameModeEl.addEventListener("change", () => {
    resetScores(state);
    updateScores(state.scores);
    startNewGame();
  });
  difficultyEl.addEventListener("change", startNewGame);
})();
