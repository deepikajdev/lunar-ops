import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventRepository } from '../repository.js';
import { MemoryCache } from '../cache.js';
import { NASA_EVENT_SNAPSHOTS } from '../../data/nasaSnapshots.js';
import { createProvenance } from '../provenance.js';
import { NasaApiError } from '../errors.js';

class MapCache extends MemoryCache {}

const liveEmptyResponse = () => ({
  data: [],
  provenance: createProvenance('NASA_LIVE', { sourceUrl: 'https://api.nasa.gov/DONKI/CME', retrievedAt: '2026-11-15T00:00:00.000Z' }),
});

test('REPLAY mode always loads genuine bundled snapshots with NASA_ARCHIVE provenance', async () => {
  const repository = createEventRepository({ apiClient: { donki: async () => { throw new Error('must not fetch in REPLAY'); } } });
  const result = await repository.getEvents('gst', { mode: 'REPLAY' });
  assert.equal(result.mode, 'REPLAY');
  assert.equal(result.delivery, 'BUNDLED_NASA_ARCHIVE');
  assert.ok(result.events.length > 0);
  assert.ok(result.events.every((event) => event.provenance.type === 'NASA_ARCHIVE'));
});

test('OFFLINE mode never calls the API and falls back to bundled NASA data', async () => {
  let calls = 0;
  const repository = createEventRepository({
    apiClient: { donki: async () => { calls += 1; throw new Error('offline'); } },
    isOnline: () => false,
  });
  const result = await repository.getEvents('sep', { mode: 'LIVE' });
  assert.equal(calls, 0);
  assert.equal(result.mode, 'OFFLINE');
  assert.equal(result.requestedMode, 'LIVE');
  assert.equal(result.delivery, 'BUNDLED_NASA_ARCHIVE');
  assert.equal(result.events[0].provenance.type, 'NASA_ARCHIVE');
});

test('serves LIVE data then returns stale cache while background refresh updates it', async () => {
  let currentTime = 1_000;
  let calls = 0;
  let updated = null;
  const memoryCache = new MapCache();
  const diskCache = new MapCache();
  const repository = createEventRepository({
    apiClient: { donki: async () => { calls += 1; return liveEmptyResponse(); } },
    memoryCache,
    persistentCache: diskCache,
    ttlMs: 10,
    now: () => currentTime,
    onUpdate: (_kind, result) => { updated = result; },
  });
  const first = await repository.getEvents('cme');
  assert.equal(first.delivery, 'NASA_LIVE');
  assert.equal(calls, 1);

  currentTime += 20;
  const stale = await repository.getEvents('cme');
  assert.equal(stale.stale, true);
  assert.equal(stale.delivery, 'MEMORY_CACHE');
  assert.ok(stale.refreshPromise);
  await stale.refreshPromise;
  assert.equal(calls, 2);
  assert.equal(updated.delivery, 'NASA_LIVE');
  assert.equal((await memoryCache.get('lunar-ops:nasa:v1:events:cme')).events.length, 0);
});

test('falls back through corrupt cache data to genuine snapshots', async () => {
  const memoryCache = new MapCache();
  const diskCache = new MapCache();
  const key = 'lunar-ops:nasa:v1:events:ips';
  await memoryCache.set(key, { events: [{ invalid: true }], savedAtMs: 1 });
  await diskCache.set(key, { events: null, savedAtMs: 1 });
  const repository = createEventRepository({
    apiClient: { donki: async () => { throw new NasaApiError('NASA_NETWORK_FAILURE', 'offline'); } },
    memoryCache,
    persistentCache: diskCache,
  });
  const result = await repository.getEvents('ips');
  assert.equal(result.delivery, 'BUNDLED_NASA_ARCHIVE');
  assert.equal(result.events.length, NASA_EVENT_SNAPSHOTS.ips.records.length);
  assert.equal((await memoryCache.get(key)).events[0].provenance.type, 'NASA_ARCHIVE');
  assert.equal(await diskCache.get(key), null);
});

test('serves stale IndexedDB data immediately and revalidates in the background', async () => {
  const archive = await createEventRepository().getEvents('sep', { mode: 'REPLAY' });
  const diskCache = new MapCache();
  await diskCache.set('lunar-ops:nasa:v1:events:sep', {
    events: archive.events,
    rejectedCount: 0,
    fetchedAt: archive.lastFetchedAt,
    savedAtMs: 1,
    provenance: archive.provenance,
  });
  let refreshed = false;
  const repository = createEventRepository({
    persistentCache: diskCache,
    now: () => 20,
    ttlMs: 10,
    apiClient: { donki: async () => { refreshed = true; return liveEmptyResponse(); } },
  });
  const result = await repository.getEvents('sep');
  assert.equal(result.delivery, 'INDEXED_DB');
  assert.equal(result.stale, true);
  assert.equal(result.events[0].provenance.type, 'NASA_ARCHIVE');
  await result.refreshPromise;
  assert.equal(refreshed, true);
});

test('persists 429 cooldown and avoids repeated API calls across repository instances', async () => {
  let currentTime = 100;
  let calls = 0;
  const diskCache = new MapCache();
  const options = {
    persistentCache: diskCache,
    now: () => currentTime,
    apiClient: { donki: async () => { calls += 1; throw new NasaApiError('NASA_RATE_LIMITED', 'rate limited', { retryAfterMs: 30_000 }); } },
  };
  const first = await createEventRepository(options).getEvents('gst');
  assert.equal(first.mode, 'OFFLINE');
  assert.equal(first.rateLimitedUntil, 30_100);

  const second = await createEventRepository(options).getEvents('gst');
  assert.equal(second.fallbackReason, 'NASA_RATE_LIMITED');
  assert.equal(second.rateLimitedUntil, 30_100);
  assert.equal(calls, 1);

  currentTime = 30_101;
  await createEventRepository(options).getEvents('gst');
  assert.equal(calls, 2);
});

test('uses a clearly simulated empty fallback when no verified snapshot exists', async () => {
  const repository = createEventRepository({ snapshots: {}, apiClient: { donki: async () => { throw new Error('offline'); } } });
  const result = await repository.getEvents('cme', { mode: 'OFFLINE' });
  assert.deepEqual(result.events, []);
  assert.equal(result.provenance.type, 'SIMULATED');
  assert.match(result.demonstration.label, /SIMULATED/);
});
