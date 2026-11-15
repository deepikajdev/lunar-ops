import { NASA_EVENT_SNAPSHOTS } from '../data/nasaSnapshots.js';
import { normalizeDonkiEvents } from './normalize.js';
import { mapEventToGameSignal } from './mappingRules.js';

const SCENARIO_RECORDS = Object.freeze([
  { id: 'may-2024-sep-radiation-context', title: 'SEP observation · 09 May 2024', description: 'Archived SEP observation presented for a radiation context review.', kind: 'sep', sourceId: '2024-05-09T13:59:00-SEP-001' },
  { id: 'may-2024-cme-solar-context', title: 'CME observation · 08 May 2024', description: 'Archived CME observation with cataloged relationships and their limits.', kind: 'cme', sourceId: '2024-05-08T05:36:00-CME-001' },
  { id: 'may-2024-gst-earth-context', title: 'GST observation · 10 May 2024', description: 'Archived GST event with source Kp values labeled as Earth geomagnetic context.', kind: 'gst', sourceId: '2024-05-10T15:00:00-GST-001' },
]);

export const NASA_REPLAY_SCENARIOS = Object.freeze(SCENARIO_RECORDS.map((scenario) => {
  const archive = NASA_EVENT_SNAPSHOTS[scenario.kind];
  const event = normalizeDonkiEvents(scenario.kind, archive.records, archive.provenance).events.find((item) => item.sourceId === scenario.sourceId);
  if (!event) throw new Error(`Verified NASA replay record is missing: ${scenario.sourceId}`);
  return Object.freeze({ ...scenario, eventId: event.id, observedAt: event.observedAt, signal: mapEventToGameSignal(event) });
}));
