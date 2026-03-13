(() => {
  const {
    BLACK,
    createInitialState,
    getValidMoves,
    applyMove,
    scoreBoard,
  } = window.OthelloGame;

  let state = createInitialState();
  let history = [];

  const boardEl = document.querySelector('[data-board]');
  const statusEl = document.querySelector('[data-status]');
  const scoreBlackEl = document.querySelector('[data-score-black]');
  const scoreWhiteEl = document.querySelector('[data-score-white]');
  const turnChipEl = document.querySelector('[data-turn-chip]');
  const movesEl = document.querySelector('[data-moves]');
  const restartBtn = document.querySelector('[data-action="restart"]');

  function playerLabel(player) {
    return player === BLACK ? 'Black' : 'White';
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
        cell.setAttribute('aria-label', `Row ${row + 1}, Column ${col + 1}`);
        const piece = state.board[row][col];
        const key = `${row},${col}`;
        const move = moveMap.get(key);

        if (move) {
          cell.classList.add('is-playable');
          cell.dataset.flips = move.flips.length;
        }
        if (state.lastMove && state.lastMove.row === row && state.lastMove.col === col) {
          cell.classList.add('is-last-move');
        }
        if (piece) {
          const disk = document.createElement('span');
          disk.className = 'disk';
          disk.dataset.player = piece === BLACK ? 'black' : 'white';
          cell.appendChild(disk);
        }
        cell.addEventListener('click', () => onCellClick(row, col));
        boardEl.appendChild(cell);
      }
    }

    movesEl.innerHTML = history.length
      ? history.map((entry, index) => `<li><strong>${index + 1}.</strong> ${entry}</li>`).join('')
      : '<li>Opening position ready.</li>';
  }

  function onCellClick(row, col) {
    const result = applyMove(state, row, col);
    if (!result.ok) return;
    const currentPlayer = state.currentPlayer;
    history.push(`${playerLabel(currentPlayer)} played ${String.fromCharCode(65 + col)}${row + 1}.`);
    state = result.state;
    render();
  }

  restartBtn.addEventListener('click', () => {
    state = createInitialState();
    history = [];
    render();
  });

  render();
})();
