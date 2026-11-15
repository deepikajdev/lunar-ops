import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../gameState.js';
import { GAME_CONFIG } from '../gameConfig.js';

test('initializes a ten-day mission with independent game-balance resources', () => {
  const state = createInitialGameState();

  assert.equal(state.day, 1);
  assert.equal(state.maxDays, 10);
  assert.equal(state.status, 'active');
  assert.equal(state.score, null);
  assert.deepEqual(Object.keys(state.resources), ['oxygen', 'water', 'food', 'power']);
  assert.equal(state.crew.length, 4);
  assert.ok(state.crew.every((person) => person.alive && person.health > 0));
  assert.equal(state.equipment.length, 5);
});

test('starting a new mission returns fresh mutable state without altering balance configuration', () => {
  const first = createInitialGameState();
  first.resources.oxygen.current = 1;
  first.crew[0].health = 2;
  const second = createInitialGameState();

  assert.equal(second.resources.oxygen.current, GAME_CONFIG.resources.oxygen.current);
  assert.equal(second.crew[0].health, 100);
  assert.equal(GAME_CONFIG.resources.oxygen.current, 92);
});
