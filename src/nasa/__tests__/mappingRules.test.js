import test from 'node:test';
import assert from 'node:assert/strict';
import { NASA_EVENT_SNAPSHOTS } from '../../data/nasaSnapshots.js';
import { normalizeDonkiEvents } from '../normalize.js';
import { mapEventToGameSignal, mapEventsToGameSignals, MAPPING_RULES, UNMAPPED_EVENT_TYPES } from '../mappingRules.js';

test('mapping rules produce only cautious, provenance-preserving annotations for genuine records', () => {
  for (const [kind, snapshot] of Object.entries(NASA_EVENT_SNAPSHOTS)) {
    const events = normalizeDonkiEvents(kind, snapshot.records, snapshot.provenance).events;
    assert.ok(events.length > 0);
    for (const event of events) {
      const signal = mapEventToGameSignal(event);
      assert.equal(signal.eventId, event.id);
      assert.deepEqual(signal.provenance, event.provenance);
      assert.ok(['DIRECT', 'INDIRECT', 'NARRATIVE', 'DERIVED'].includes(signal.classification));
      assert.equal(signal.simulationEffects.crewHealth, 0);
      assert.deepEqual(signal.simulationEffects.resources, {});
      assert.equal(signal.sourceRecord, undefined);
    }
  }
});

test('rules avoid unsupported direct causality and retain source-specific caveats', () => {
  assert.equal(Object.values(MAPPING_RULES).some((rule) => rule.classification === 'DIRECT'), false);
  assert.match(MAPPING_RULES.GST.rationale, /Earth/);
  assert.match(MAPPING_RULES.SEP.effects, /Informational only/);
  assert.equal(UNMAPPED_EVENT_TYPES.FLR.status, 'SCHEMA_UNVERIFIED');
});

test('mapper ignores unsupported, malformed, and unverified FLR records', () => {
  assert.equal(mapEventToGameSignal({ eventType: 'FLR', id: 'FLR:unknown', provenance: { type: 'NASA_ARCHIVE' }, sourceUrl: 'https://api.nasa.gov/' }), null);
  assert.equal(mapEventToGameSignal({ eventType: 'CME', id: 'CME:1' }), null);
  assert.deepEqual(mapEventsToGameSignals([]), []);
  assert.equal(MAPPING_RULES.CME.classification, 'NARRATIVE');
});
