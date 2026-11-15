import test from 'node:test';
import assert from 'node:assert/strict';
import { createShellState, NAV_ITEMS, resolveNavigationView, shellReducer } from './navigation.js';

test('every visible navigation destination resolves to a distinct application view', () => {
  const views = NAV_ITEMS.map(({ label }) => resolveNavigationView(label));
  assert.ok(views.every(Boolean));
  assert.equal(new Set(views).size, NAV_ITEMS.length);
  assert.equal(resolveNavigationView('Unknown destination'), null);
});

test('navigation changes the active destination and closes open control panels', () => {
  const state = { ...createShellState(), openPanel: 'notifications' };
  const next = shellReducer(state, { type: 'navigate', destination: 'Crew' });
  assert.deepEqual(next, { activeNav: 'Crew', openPanel: null });
  assert.equal(shellReducer(state, { type: 'navigate', destination: 'invalid' }), state);
});

test('mission and notification controls toggle mutually exclusive panels and close cleanly', () => {
  let state = createShellState();
  state = shellReducer(state, { type: 'toggle-panel', panel: 'notifications' });
  assert.equal(state.openPanel, 'notifications');
  state = shellReducer(state, { type: 'toggle-panel', panel: 'mission' });
  assert.equal(state.openPanel, 'mission');
  state = shellReducer(state, { type: 'toggle-panel', panel: 'mission' });
  assert.equal(state.openPanel, null);
  assert.equal(shellReducer(state, { type: 'toggle-panel', panel: 'profile' }), state);
});
