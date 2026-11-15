import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateDonkiPayload, validateImagePayload, parseJsonResponse } from '../../../src/nasa/schemas.js';
import { createProvenance, PROVENANCE_TYPES } from '../../../src/nasa/provenance.js';

const fixtures = new URL('../../../tests/fixtures/nasa/', import.meta.url);
const loadFixture = async (name) => JSON.parse(await readFile(fileURLToPath(new URL(name, fixtures)), 'utf8'));

for (const kind of ['cme', 'gst', 'sep', 'ips']) {
  test(`validates genuine DONKI ${kind.toUpperCase()} fixture including nullable fields`, async () => {
    const data = await loadFixture(`donki-${kind}-2024-05-08-to-12-demokey-test.json`);
    assert.equal(validateDonkiPayload(kind, data), data);
    if (kind !== 'gst') assert.ok(data.some((record) => record.linkedEvents === null || record.sentNotifications === null));
  });
}

test('accepts valid empty DONKI arrays and rejects malformed records', () => {
  assert.deepEqual(validateDonkiPayload('gst', []), []);
  assert.throws(() => validateDonkiPayload('gst', [{ gstID: 3 }]), { code: 'NASA_INVALID_RESPONSE_SCHEMA' });
  assert.throws(() => validateDonkiPayload('cme', null), { code: 'NASA_INVALID_RESPONSE_SCHEMA' });
});

test('does not define an FLR schema', () => {
  assert.throws(() => validateDonkiPayload('flr', []), { code: 'NASA_SCHEMA_UNVERIFIED' });
});

test('validates genuine Images search, asset and metadata fixtures', async () => {
  for (const [kind, name] of [
    ['search', 'images-search-lunar-outpost.json'],
    ['asset', 'images-asset-jsc2026e417568.json'],
    ['metadata', 'images-metadata-jsc2026e417568.json'],
  ]) {
    const payload = await loadFixture(name);
    assert.equal(validateImagePayload(kind, payload), payload);
  }
});

test('accepts empty Images search results and rejects malformed item fields', () => {
  const empty = { collection: { metadata: { total_hits: 0 }, items: [] } };
  assert.equal(validateImagePayload('search', empty), empty);
  const invalid = { collection: { metadata: { total_hits: 1 }, items: [{ data: [{ nasa_id: 'x', title: 'bad', media_type: 2 }] }] } };
  assert.throws(() => validateImagePayload('search', invalid), { code: 'NASA_INVALID_RESPONSE_SCHEMA' });
});

test('normalizes invalid JSON and captures all provenance categories', () => {
  assert.throws(() => parseJsonResponse('{'), { code: 'NASA_INVALID_JSON' });
  assert.deepEqual(PROVENANCE_TYPES, ['NASA_LIVE', 'NASA_ARCHIVE', 'DERIVED', 'SIMULATED']);
  assert.equal(createProvenance('NASA_LIVE', { sourceUrl: 'https://api.nasa.gov/DONKI/CME', retrievedAt: '2026-01-01T00:00:00Z' }).type, 'NASA_LIVE');
  assert.equal(createProvenance('NASA_ARCHIVE', { sourceUrl: 'fixture.json', archivedAt: '2026-01-01' }).type, 'NASA_ARCHIVE');
  assert.equal(createProvenance('DERIVED', { calculation: 'a / b', inputs: ['a', 'b'] }).type, 'DERIVED');
  assert.equal(createProvenance('SIMULATED', { model: 'game balance' }).type, 'SIMULATED');
  assert.throws(() => createProvenance('NASA_LIVE'), /requires sourceUrl and retrievedAt/);
});
