import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from './gameState.js';
import { simulationReducer } from './engine.js';
import { NASA_REPLAY_SCENARIOS } from '../nasa/replayScenarios.js';
import { NASA_EVENT_SNAPSHOTS } from '../data/nasaSnapshots.js';

test('three replay briefings reference distinct verified NASA snapshot records', () => {
  assert.equal(NASA_REPLAY_SCENARIOS.length, 3);
  assert.equal(new Set(NASA_REPLAY_SCENARIOS.map((scenario) => scenario.eventId)).size, 3);
  for (const scenario of NASA_REPLAY_SCENARIOS) {
    const ids = NASA_EVENT_SNAPSHOTS[scenario.kind].records.map((record) => record.activityID || record.gstID || record.sepID);
    assert.ok(ids.includes(scenario.sourceId));
    assert.equal(scenario.signal.eventId, scenario.eventId);
    assert.equal(scenario.signal.provenance.type, 'NASA_ARCHIVE');
  }
});

test('receiving a NASA briefing stores only a safe signal and cannot alter simulation state', () => {
  const state = createInitialGameState(123);
  const resources = structuredClone(state.resources);
  const crew = structuredClone(state.crew);
  const equipment = structuredClone(state.equipment);
  const next = simulationReducer(state, { type: 'receive-game-signal', signal: NASA_REPLAY_SCENARIOS[0].signal });
  assert.equal(next.spaceWeatherContext.length, 1);
  assert.deepEqual(next.resources, resources);
  assert.deepEqual(next.crew, crew);
  assert.deepEqual(next.equipment, equipment);
  assert.equal('sourceRecord' in next.spaceWeatherContext[0], false);
  assert.equal(simulationReducer(next, { type: 'receive-game-signal', signal: NASA_REPLAY_SCENARIOS[0].signal }), next);
});

test('rejects raw records, effectful annotations, and signals after the mission ends', () => {
  const state = createInitialGameState();
  const signal = NASA_REPLAY_SCENARIOS[0].signal;
  assert.equal(simulationReducer(state, { type: 'receive-game-signal', signal: { ...signal, sourceRecord: { private: true } } }), state);
  assert.equal(simulationReducer(state, { type: 'receive-game-signal', signal: { ...signal, rawRecord: { private: true } } }), state);
  assert.equal(simulationReducer(state, { type: 'receive-game-signal', signal: { ...signal, sourceUrl: 'javascript:alert(1)' } }), state);
  assert.equal(simulationReducer(state, { type: 'receive-game-signal', signal: { ...signal, simulationEffects: { ...signal.simulationEffects, crewHealth: -8 } } }), state);
  const ended = { ...state, status: 'failed' };
  assert.equal(simulationReducer(ended, { type: 'receive-game-signal', signal }), ended);
});
