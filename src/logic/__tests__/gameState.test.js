import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../gameState.js';
import { GAME_CONFIG } from '../gameConfig.js';
import { advanceDay } from '../engine.js';

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

test('advances one day using configured consumption and production for every resource', () => {
  const next = advanceDay(createInitialGameState());

  assert.equal(next.day, 2);
  assert.deepEqual(
    Object.fromEntries(Object.entries(next.resources).map(([id, item]) => [id, item.current])),
    { oxygen: 85.8, water: 83.4, food: 85, power: 73.8 },
  );
  assert.equal(next.history.length, 1);
  assert.equal(next.history[0].day, 1);
});

test('clamps production to capacity and prevents shortages from making reserves negative', () => {
  const state = createInitialGameState();
  state.resources.power.current = 99;
  state.resources.power.production = 50;
  state.resources.oxygen.current = 3;
  state.resources.oxygen.production = 0;

  const next = advanceDay(state);
  assert.equal(next.resources.power.current, 100);
  assert.equal(next.resources.oxygen.current, 0);
  assert.ok(Object.values(next.resources).every((item) => item.current >= 0 && item.current <= item.max));
  assert.equal(state.resources.oxygen.current, 3, 'the input state remains unchanged');
});

test('does not advance an inactive mission or move beyond the final mission day', () => {
  const failed = { ...createInitialGameState(), status: 'failed' };
  assert.equal(advanceDay(failed), failed);

  const lastDay = { ...createInitialGameState(), day: 10 };
  const next = advanceDay(lastDay);
  assert.equal(next.day, 10);
  assert.equal(next.history.length, 1);
  assert.equal(advanceDay(next), next);
});

test('recycler and solar equipment condition changes daily production', () => {
  const state = createInitialGameState();
  state.equipment.find((item) => item.id === 'oxygen-recycler').condition = 0;
  state.equipment.find((item) => item.id === 'solar-array').condition = 0;
  const next = advanceDay(state);

  assert.equal(next.resources.oxygen.current, 82);
  assert.equal(next.resources.power.current, 44);
});

test('resource shortage and blackout consequences affect crew and equipment safely', () => {
  const state = createInitialGameState();
  state.resources.water.current = 1;
  state.resources.power.current = 0;
  state.equipment.find((item) => item.id === 'solar-array').condition = 0;

  const next = advanceDay(state);
  assert.equal(next.resources.water.current, 0);
  assert.deepEqual(next.crew.map((person) => person.health), [84, 80, 82, 81]);
  assert.equal(next.continuity, 92);
  assert.equal(next.equipment.find((item) => item.id === 'habitat-systems').condition, 84);
  assert.ok(next.crew.every((person) => person.health >= 0));
});

test('equipment wears down once per day after applying its effect on generation', () => {
  const state = createInitialGameState();
  const next = advanceDay(state);
  assert.equal(next.equipment.find((item) => item.id === 'solar-array').condition, 95);
  assert.equal(next.equipment.find((item) => item.id === 'oxygen-recycler').condition, 93);
  assert.equal(state.equipment.find((item) => item.id === 'solar-array').condition, 96);
});
