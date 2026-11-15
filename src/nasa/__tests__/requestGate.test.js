import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestGate } from '../requestGate.js';

test('a newer mode request invalidates an older in-flight request', () => {
  const gate = createRequestGate();
  const liveRequest = gate.begin();
  const replayRequest = gate.begin();
  assert.equal(gate.isCurrent(liveRequest), false);
  assert.equal(gate.isCurrent(replayRequest), true);
});

test('unmount invalidation prevents outstanding requests from updating view state', () => {
  const gate = createRequestGate();
  const request = gate.begin();
  gate.invalidate();
  assert.equal(gate.isCurrent(request), false);
});
