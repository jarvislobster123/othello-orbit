(() => {
  const {
    BLACK,
    createInitialState,
    getValidMoves,
    applyMove,
    scoreBoard,
    getSuggestedMove,
    cloneBoard,
  } = window.OthelloGame;

  let state = createInitialState();
  let history = [];
  let snapshots = [];
  let suggestedMoveKey = null;
  let focusedCell = { row: 3, col: 3 };

  const boardEl = document.querySelector('[data-board]');
  const statusEl = document.querySelector('[data-status]');
  const scoreBlackEl = document.querySelector('[data-score-black]');
  const scoreWhiteEl = document.querySelector('[data-score-white]');
  const turnChipEl = document.querySelector('[data-turn-chip]');
  const movesEl = document.querySelector('[data-moves]');
  const restartBtn = document.querySelector('[data-action="restart"]');
  const undoBtn = document.querySelector('[data-action="undo"]');
  const hintBtn = document.querySelector('[data-action="hint"]');
  const themeBtn = document.querySelector('[data-action="theme"]');
  const hintEl = document.querySelector('[data-hint]');
  const root = document.documentElement;

  const savedTheme = localStorage.getItem('othello-orbit-theme');
  if (savedTheme) root.dataset.theme = savedTheme;

  function playerLabel(player) {
    return player === BLACK ? 'Black' : 'White';
  }

  function toCoordinate(row, col) {
    return `${String.fromCharCode(65 + col)}${row + 1}`;
  }

  function snapshotState() {
    return {
      ...state,
      board: cloneBoard(state.board),
      lastMove: state.lastMove ? { ...state.lastMove } : null,
    };
  }

  function clampFocus(row, col) {
    return {
      row: Math.max(0, Math.min(7, row)),
      col: Math.max(0, Math.min(7, col)),
    };
  }

  function focusCell(row, col) {
    focusedCell = clampFocus(row, col);
    const nextFocusEl = boardEl.querySelector(`[data-row="${focusedCell.row}"][data-col="${focusedCell.col}"]`);
    if (nextFocusEl) nextFocusEl.focus();
  }

  function clearHint() {
    suggestedMoveKey = null;
  }

  function render() {
    const moves = getValidMoves(state.board, state.currentPlayer);
    const score = scoreBoard(state.board);
    scoreBlackEl.textContent = score.black;
    scoreWhiteEl.textContent = score.white;
    turnChipEl.dataset.player = state.currentPlayer === BLACK ? 'black' : 'white';
    statusEl.textContent = state.winner
      ? state.winner === 'draw'
        ? 'Game over — draw game.'
        : `Game over — ${state.winner[0].toUpperCase()}${state.winner.slice(1)} wins.`
      : state.passes === 1
        ? `${playerLabel(state.currentPlayer)} moves again because the opponent had no legal play.`
        : `${playerLabel(state.currentPlayer)} to move · ${moves.length} legal move${moves.length === 1 ? '' : 's'}.`;

    boardEl.innerHTML = '';
    const moveMap = new Map(moves.map((move) => [`${move.row},${move.col}`, move]));

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const cell = document.createElement('button');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.type = 'button';
        cell.setAttribute('role', 'gridcell');
        cell.tabIndex = row === focusedCell.row && col === focusedCell.col ? 0 : -1;
        const piece = state.board[row][col];
        const key = `${row},${col}`;
        const move = moveMap.get(key);
        const coordinate = toCoordinate(row, col);

        if (move) {
          cell.classList.add('is-playable');
          cell.dataset.flips = move.flips.length;
          cell.title = `Flip ${move.flips.length} disc${move.flips.length === 1 ? '' : 's'}`;
        }
        if (suggestedMoveKey === key) {
          cell.classList.add('is-suggested');
        }
        if (state.lastMove && state.lastMove.row === row && state.lastMove.col === col) {
          cell.classList.add('is-last-move');
        }
        cell.setAttribute(
          'aria-label',
          `${coordinate}${piece ? `, ${piece === BLACK ? 'black' : 'white'} disc` : move ? `, legal move flipping ${move.flips.length}` : ', empty'}`,
        );
        if (piece) {
          const disk = document.createElement('span');
          disk.className = 'disk';
          disk.dataset.player = piece === BLACK ? 'black' : 'white';
          cell.appendChild(disk);
        }
        cell.addEventListener('click', () => onCellClick(row, col));
        cell.addEventListener('focus', () => {
          focusedCell = { row, col };
        });
        cell.addEventListener('keydown', (event) => onCellKeydown(event, row, col));
        boardEl.appendChild(cell);
      }
    }

    movesEl.innerHTML = history.length
      ? history.map((entry, index) => `<li><strong>${index + 1}.</strong> ${entry}</li>`).join('')
      : '<li>Opening position ready.</li>';

    undoBtn.disabled = snapshots.length === 0;
  }

  function onCellClick(row, col) {
    const result = applyMove(state, row, col);
    if (!result.ok) return;
    const currentPlayer = state.currentPlayer;
    snapshots.push(snapshotState());
    history.push(`${playerLabel(currentPlayer)} played ${toCoordinate(row, col)} and flipped ${result.state.lastMove.flipped} disc${result.state.lastMove.flipped === 1 ? '' : 's'}.`);
    if (!result.state.winner && result.state.passes === 1 && result.state.currentPlayer === currentPlayer) {
      history.push(`${playerLabel(-currentPlayer)} had no legal move and passed.`);
    }
    state = result.state;
    clearHint();
    hintEl.textContent = 'Hint panel ready.';
    focusedCell = { row, col };
    render();
    focusCell(row, col);
  }

  function onCellKeydown(event, row, col) {
    const directions = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    if (event.key in directions) {
      event.preventDefault();
      const [dr, dc] = directions[event.key];
      focusCell(row + dr, col + dc);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onCellClick(row, col);
    }
  }

  restartBtn.addEventListener('click', () => {
    state = createInitialState();
    history = [];
    snapshots = [];
    clearHint();
    hintEl.textContent = 'Hint panel ready.';
    focusedCell = { row: 3, col: 3 };
    render();
    focusCell(focusedCell.row, focusedCell.col);
  });

  undoBtn.addEventListener('click', () => {
    if (!snapshots.length) return;
    state = snapshots.pop();
    history.pop();
    if (history.at(-1)?.includes('had no legal move and passed.')) {
      history.pop();
    }
    clearHint();
    hintEl.textContent = 'Last move undone.';
    focusedCell = state.lastMove ? { row: state.lastMove.row, col: state.lastMove.col } : { row: 3, col: 3 };
    render();
    focusCell(focusedCell.row, focusedCell.col);
  });

  hintBtn.addEventListener('click', () => {
    const suggestion = getSuggestedMove(state.board, state.currentPlayer);
    if (!suggestion) {
      clearHint();
      hintEl.textContent = 'No legal moves available.';
      render();
      return;
    }
    suggestedMoveKey = `${suggestion.row},${suggestion.col}`;
    hintEl.textContent = `Suggested move: ${toCoordinate(suggestion.row, suggestion.col)} · flips ${suggestion.flips.length} · estimated pressure ${suggestion.score}.`;
    render();
    focusCell(suggestion.row, suggestion.col);
  });

  themeBtn.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'sunrise' ? 'midnight' : 'sunrise';
    root.dataset.theme = nextTheme;
    localStorage.setItem('othello-orbit-theme', nextTheme);
  });

  render();
})();
