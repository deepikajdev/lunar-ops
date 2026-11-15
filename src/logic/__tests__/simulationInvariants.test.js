import test from 'node:test';
import assert from 'node:assert/strict';
import { canSelectDecision, selectDecision, simulationReducer } from '../engine.js';
import { DECISION_CATALOG } from '../decisions.js';
import { createInitialGameState } from '../gameState.js';

function play(seed) {
  let state = createInitialGameState(seed);
  for (let day = 0; day < state.maxDays && state.status === 'active'; day += 1) {
    const preferred = DECISION_CATALOG[(seed + day) % DECISION_CATALOG.length];
    if (canSelectDecision(state, preferred.id)) state = selectDecision(state, preferred.id);
    state = simulationReducer(state, { type: 'advance-day' });
  }
  return state;
}

test('many seeded playthroughs preserve resource, crew, equipment, and mission bounds', () => {
  for (let seed = 1; seed <= 100; seed += 1) {
    const state = play(seed);
    assert.ok(state.day >= 1 && state.day <= state.maxDays, `seed ${seed}: day out of range`);
    assert.ok(state.history.length <= state.maxDays, `seed ${seed}: too many log entries`);
    assert.ok(['success', 'partial', 'failed'].includes(state.status), `seed ${seed}: mission did not end`);
    assert.ok(state.score.total >= 0 && state.score.total <= 100, `seed ${seed}: score out of range`);

    for (const [id, resource] of Object.entries(state.resources)) {
      assert.ok(resource.current >= 0 && resource.current <= resource.max, `seed ${seed}: invalid ${id} reserve`);
    }
    for (const person of state.crew) {
      assert.ok(person.health >= 0 && person.health <= 100, `seed ${seed}: invalid crew health`);
      assert.equal(person.alive, person.health > 0, `seed ${seed}: alive flag out of sync`);
    }
    for (const item of state.equipment) {
      assert.ok(item.condition >= 0 && item.condition <= 100, `seed ${seed}: invalid ${item.id} condition`);
    }
  }
});

test('same seed and decision sequence reproduce the same event, log, and score history', () => {
  assert.deepEqual(play(2086), play(2086));
});

test('unknown reducer actions and unaffordable decisions leave game state unchanged', () => {
  const state = createInitialGameState();
  const unknown = simulationReducer(state, { type: 'not-a-game-action' });
  assert.equal(unknown, state);

  state.resources.power.current = 0;
  assert.equal(canSelectDecision(state, 'repair_systems'), false);
  assert.equal(selectDecision(state, 'repair_systems'), state);
  assert.equal(state.selectedDecisionId, 'balanced_ops');
});
