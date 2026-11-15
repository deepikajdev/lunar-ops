import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../gameState.js';
import { GAME_CONFIG } from '../gameConfig.js';
import { advanceDay, canSelectDecision, selectDecision } from '../engine.js';
import { EVENT_CATALOG, getEventForDay } from '../events.js';
import { DECISION_CATALOG } from '../decisions.js';

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

test('event catalog includes the required configurable and actionable event types', () => {
  assert.deepEqual(new Set(EVENT_CATALOG.map((event) => event.id)), new Set([
    'solar-storm-warning', 'power-malfunction', 'water-recycling-failure', 'oxygen-leak',
    'equipment-overheating', 'communication-disruption', 'solar-panel-dust',
  ]));
  assert.ok(EVENT_CATALOG.every((event) => event.description && event.severity && event.trigger.probability > 0 && Object.keys(event.responses).length > 0));
});

test('seeded event selection is reproducible and never stacks multiple events on a day', () => {
  const firstRun = Array.from({ length: 10 }, (_, index) => getEventForDay(718, index + 1)?.id ?? null);
  const secondRun = Array.from({ length: 10 }, (_, index) => getEventForDay(718, index + 1)?.id ?? null);
  assert.deepEqual(firstRun, secondRun);
  assert.ok(firstRun.some(Boolean));

  let previous = null;
  const sequential = Array.from({ length: 10 }, (_, index) => {
    const event = getEventForDay(718, index + 1, previous);
    previous = event?.id ?? previous;
    return event?.id ?? null;
  });
  for (let i = 1; i < sequential.length; i += 1) {
    if (sequential[i] && sequential[i - 1]) assert.notEqual(sequential[i], sequential[i - 1]);
  }
});

test('initialization and day progression assign deterministic events to each day', () => {
  const state = createInitialGameState(718);
  const next = advanceDay(state);
  assert.equal(state.activeEvent?.id ?? null, getEventForDay(718, 1)?.id ?? null);
  assert.equal(next.activeEvent?.id ?? null, getEventForDay(718, 2, state.activeEvent?.id ?? null)?.id ?? null);
  assert.equal(next.eventCount, state.eventCount + (next.activeEvent ? 1 : 0));
});

test('decision catalog provides tradeoffs for all required survival controls', () => {
  const ids = new Set(DECISION_CATALOG.map((decision) => decision.id));
  for (const id of ['emergency_power', 'reduced_operations', 'oxygen_priority', 'repair_systems', 'emergency_shelter', 'water_conservation', 'delay_activity']) {
    assert.ok(ids.has(id), `missing decision ${id}`);
    const choice = DECISION_CATALOG.find((decision) => decision.id === id);
    assert.ok(choice.costs && choice.benefits && choice.risks);
  }
});

test('decisions change daily resources, equipment, crew health, and continuity', () => {
  const noEvent = createInitialGameState();
  noEvent.activeEvent = null;
  const reduced = advanceDay(selectDecision(noEvent, 'reduced_operations'));
  assert.equal(reduced.resources.power.current, 83.8);
  assert.equal(reduced.continuity, 99);

  const conserve = { ...noEvent, selectedDecisionId: 'water_conservation' };
  const conserved = advanceDay(conserve);
  assert.equal(conserved.resources.water.current, 88.4);
  assert.deepEqual(conserved.crew.map((person) => person.health), [99, 95, 97, 96]);

  const repair = { ...noEvent, selectedDecisionId: 'repair_systems' };
  const repaired = advanceDay(repair);
  assert.equal(repaired.resources.power.current, 67);
  assert.equal(repaired.equipment.find((item) => item.id === 'water-recycler').condition, 95);
});

test('unaffordable and unknown decisions are rejected without mutating state', () => {
  const state = createInitialGameState();
  state.resources.power.current = 7;
  assert.equal(canSelectDecision(state, 'repair_systems'), false);
  assert.equal(selectDecision(state, 'repair_systems'), state);
  assert.equal(canSelectDecision(state, 'unknown_choice'), false);
  assert.equal(selectDecision(state, 'unknown_choice'), state);
  assert.equal(state.selectedDecisionId, 'balanced_ops');
});

test('event consequences apply and a compatible choice mitigates the incident', () => {
  const state = createInitialGameState();
  state.activeEvent = EVENT_CATALOG.find((event) => event.id === 'power-malfunction');
  state.eventCount = 1;
  const addressed = advanceDay(selectDecision(state, 'repair_systems'));

  assert.equal(addressed.emergencyResponses, 1);
  assert.equal(addressed.equipment.find((item) => item.id === 'backup-generator').condition, 90);
  assert.equal(addressed.history[0].eventResponse, 'Repair generator');
  assert.match(addressed.history[0].summary, /power malfunction/i);

  const unmitigated = advanceDay({ ...state, selectedDecisionId: 'balanced_ops' });
  assert.equal(unmitigated.emergencyResponses, 0);
  assert.ok(unmitigated.resources.power.current < addressed.resources.power.current);
});
