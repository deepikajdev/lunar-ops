import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { normalizeDonkiEvents } from '../../../src/nasa/normalize.js';
import { createProvenance } from '../../../src/nasa/provenance.js';

const fixtures = new URL('../../../tests/fixtures/nasa/', import.meta.url);
const load = async (kind) => JSON.parse(await readFile(fileURLToPath(new URL(`donki-${kind}-2024-05-08-to-12-demokey-test.json`, fixtures)), 'utf8'));
const archiveFor = (kind) => createProvenance('NASA_ARCHIVE', {
  sourceUrl: `https://api.nasa.gov/DONKI/${kind.toUpperCase()}?startDate=2024-05-08&endDate=2024-05-12`,
  archivedAt: '2026-11-15T04:47:23.000Z',
});

for (const kind of ['cme', 'gst', 'sep', 'ips']) {
  test(`normalizes genuine ${kind.toUpperCase()} records with raw provenance and source records`, async () => {
    const sourceRecords = await load(kind);
    const archive = archiveFor(kind);
    const { events, rejected } = normalizeDonkiEvents(kind, sourceRecords, archive);
    assert.equal(rejected.length, 0);
    assert.equal(events.length, sourceRecords.length);
    assert.equal(events[0].eventType, kind.toUpperCase());
    assert.equal(events[0].provenance.type, 'NASA_ARCHIVE');
    assert.equal(events[0].retrievedAt, archive.archivedAt);
    assert.equal(events[0].sourceRecord, sourceRecords.find((record) => record[Object.hasOwn(record, 'gstID') ? 'gstID' : Object.hasOwn(record, 'sepID') ? 'sepID' : 'activityID'] === events[0].sourceId));
    assert.ok(events.every((event) => event.revisionHistory.length === 1));
  });
}

test('preserves nullable links and produces source-based measurements only', async () => {
  const cme = await load('cme');
  const normalized = normalizeDonkiEvents('cme', cme, archiveFor('cme')).events;
  const nullable = normalized.find((event) => event.sourceRecord.linkedEvents === null);
  assert.equal(nullable.linkedEventIds, null);
  assert.equal(nullable.regions.activeRegionNumber, null);
  assert.ok(normalized.some((event) => event.magnitude.some((item) => Number.isFinite(item.speedKmPerSecond))));

  const gst = normalizeDonkiEvents('gst', await load('gst'), archiveFor('gst')).events;
  assert.ok(gst[0].magnitude.every((item) => item.kind === 'KP_INDEX' && Number.isFinite(item.value)));
  const sep = normalizeDonkiEvents('sep', await load('sep'), archiveFor('sep')).events;
  assert.deepEqual(sep[0].magnitude, []);
});

test('rejects malformed records and invalid timestamps while allowing absent optional fields', async () => {
  const original = (await load('cme'))[0];
  const archive = archiveFor('cme');
  const invalidTime = { ...original, startTime: 'not-a-time' };
  const absentOptional = { ...original };
  delete absentOptional.startTime;
  delete absentOptional.versionId;
  const result = normalizeDonkiEvents('cme', [original, invalidTime, null], archive);
  assert.equal(result.events.length, 1);
  assert.equal(result.rejected.length, 2);
  assert.match(result.rejected[0].reason, /startTime is not a valid timestamp/);
  assert.equal(result.rejected[1].sourceRecord, null);

  const missingOptional = normalizeDonkiEvents('cme', [absentOptional], archive);
  assert.equal(missingOptional.events[0].observedAt, null);
  assert.equal(missingOptional.events[0].versionId, null);
});

test('deduplicates repeated event IDs while retaining every raw version', async () => {
  const source = (await load('gst'))[0];
  const result = normalizeDonkiEvents('gst', [source, source], archiveFor('gst'));
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].revisionHistory.length, 2);
  assert.strictEqual(result.events[0].revisionHistory[0].sourceRecord, source);
  assert.strictEqual(result.events[0].revisionHistory[1].sourceRecord, source);
});
