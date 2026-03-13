const EMPTY = 0;
const BLACK = 1;
const WHITE = -1;
const SIZE = 8;
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

function createInitialState() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;
  return {
    board,
    currentPlayer: BLACK,
    passes: 0,
    winner: null,
    lastMove: null,
  };
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function inBounds(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function getFlips(board, row, col, player) {
  if (!inBounds(row, col) || board[row][col] !== EMPTY) return [];
  const flips = [];

  for (const [dr, dc] of DIRECTIONS) {
    const line = [];
    let r = row + dr;
    let c = col + dc;

    while (inBounds(r, c) && board[r][c] === -player) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }

    if (line.length && inBounds(r, c) && board[r][c] === player) {
      flips.push(...line);
    }
  }

  return flips;
}

function getValidMoves(board, player) {
  const moves = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const flips = getFlips(board, row, col, player);
      if (flips.length) moves.push({ row, col, flips });
    }
  }
  return moves;
}

function scoreBoard(board) {
  return board.flat().reduce((acc, cell) => {
    if (cell === BLACK) acc.black += 1;
    if (cell === WHITE) acc.white += 1;
    return acc;
  }, { black: 0, white: 0 });
}

function determineWinner(board) {
  const { black, white } = scoreBoard(board);
  if (black === white) return 'draw';
  return black > white ? 'black' : 'white';
}

function applyMove(state, row, col) {
  const flips = getFlips(state.board, row, col, state.currentPlayer);
  if (!flips.length) return { ok: false, reason: 'invalid-move' };

  const board = cloneBoard(state.board);
  board[row][col] = state.currentPlayer;
  for (const [r, c] of flips) board[r][c] = state.currentPlayer;

  let nextPlayer = -state.currentPlayer;
  let passes = 0;
  let winner = null;

  const nextMoves = getValidMoves(board, nextPlayer);
  if (!nextMoves.length) {
    passes = 1;
    nextPlayer = state.currentPlayer;
    const currentMoves = getValidMoves(board, nextPlayer);
    if (!currentMoves.length) {
      passes = 2;
      winner = determineWinner(board);
    }
  }

  return {
    ok: true,
    state: {
      board,
      currentPlayer: nextPlayer,
      passes,
      winner,
      lastMove: { row, col, player: state.currentPlayer, flipped: flips.length },
    },
  };
}

function isCorner(row, col) {
  return (row === 0 || row === SIZE - 1) && (col === 0 || col === SIZE - 1);
}

function isEdge(row, col) {
  return row === 0 || col === 0 || row === SIZE - 1 || col === SIZE - 1;
}

function getSuggestedMove(board, player) {
  const moves = getValidMoves(board, player);
  if (!moves.length) return null;
  return moves
    .map((move) => ({
      ...move,
      score: move.flips.length + (isCorner(move.row, move.col) ? 100 : 0) + (isEdge(move.row, move.col) ? 10 : 0),
    }))
    .sort((a, b) => b.score - a.score)[0];
}

const api = {
  EMPTY,
  BLACK,
  WHITE,
  SIZE,
  createInitialState,
  cloneBoard,
  getFlips,
  getValidMoves,
  applyMove,
  scoreBoard,
  determineWinner,
  getSuggestedMove,
};

if (typeof module !== 'undefined') module.exports = api;
if (typeof window !== 'undefined') window.OthelloGame = api;
