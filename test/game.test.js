const test = require('node:test');
const assert = require('node:assert/strict');
const { BLACK, WHITE, createInitialState, getValidMoves, applyMove, scoreBoard, getSuggestedMove } = require('../game.js');

test('initial position exposes four moves for black', () => {
  const state = createInitialState();
  const moves = getValidMoves(state.board, BLACK).map(({ row, col }) => `${row},${col}`).sort();
  assert.deepEqual(moves, ['2,3', '3,2', '4,5', '5,4']);
});

test('applying a valid move flips opposing discs and updates score', () => {
  const state = createInitialState();
  const result = applyMove(state, 2, 3);
  assert.equal(result.ok, true);
  const score = scoreBoard(result.state.board);
  assert.deepEqual(score, { black: 4, white: 1 });
  assert.equal(result.state.currentPlayer, WHITE);
});

test('suggested move prefers corners when available', () => {
  const state = createInitialState();
  state.board[0][1] = WHITE;
  state.board[0][2] = BLACK;
  const suggestion = getSuggestedMove(state.board, BLACK);
  assert.equal(suggestion.row, 0);
  assert.equal(suggestion.col, 0);
});
