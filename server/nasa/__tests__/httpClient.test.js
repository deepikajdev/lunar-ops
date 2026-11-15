import test from 'node:test';
import assert from 'node:assert/strict';
import { createNasaHttpClient } from '../httpClient.js';
import { createNasaAdapters } from '../adapters.js';

const jsonResponse = (value, status = 200, headers = {}) => new Response(typeof value === 'string' ? value : JSON.stringify(value), {
  status,
  headers: { 'content-type': 'application/json', ...headers },
});

test('retries network failure and eligible 5xx with bounded exponential jitter', async () => {
  let calls = 0;
  const delays = [];
  const client = createNasaHttpClient({
    fetchImpl: async () => { calls += 1; if (calls < 3) throw new TypeError('offline'); return jsonResponse({ ok: true }); },
    maxRetries: 2,
    baseDelayMs: 100,
    random: () => 0.5,
    sleep: async (delay) => delays.push(delay),
  });
  const result = await client.requestJson('https://api.nasa.gov/test');
  assert.deepEqual(result.payload, { ok: true });
  assert.equal(calls, 3);
  assert.deepEqual(delays, [50, 100]);

  let serverCalls = 0;
  const serverClient = createNasaHttpClient({
    fetchImpl: async () => (++serverCalls < 2 ? jsonResponse({}, 503) : jsonResponse({ ok: true })),
    maxRetries: 1,
    sleep: async () => {},
  });
  assert.deepEqual((await serverClient.requestJson('https://api.nasa.gov/test')).payload, { ok: true });
  assert.equal(serverCalls, 2);
});

test('retries response-body network failures but does not retry malformed JSON', async () => {
  let calls = 0;
  const client = createNasaHttpClient({
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        const response = jsonResponse({});
        response.text = async () => { throw new TypeError('body connection reset'); };
        return response;
      }
      return jsonResponse({ ok: true });
    },
    maxRetries: 1,
    sleep: async () => {},
  });
  assert.deepEqual((await client.requestJson('https://api.nasa.gov/test')).payload, { ok: true });
  assert.equal(calls, 2);

  const malformed = createNasaHttpClient({ fetchImpl: async () => jsonResponse('{'), maxRetries: 3 });
  await assert.rejects(malformed.requestJson('https://api.nasa.gov/test'), { code: 'NASA_INVALID_JSON' });
});

test('stops retrying after configured attempts and normalizes network failure', async () => {
  let calls = 0;
  const client = createNasaHttpClient({ fetchImpl: async () => { calls += 1; throw new TypeError('offline'); }, maxRetries: 1, sleep: async () => {} });
  await assert.rejects(client.requestJson('https://api.nasa.gov/test'), { code: 'NASA_NETWORK_FAILURE' });
  assert.equal(calls, 2);
});

test('caps caller-configured retries so the request loop cannot be unbounded', async () => {
  let calls = 0;
  const client = createNasaHttpClient({
    fetchImpl: async () => { calls += 1; throw new TypeError('offline'); },
    maxRetries: 999,
    sleep: async () => {},
  });
  await assert.rejects(client.requestJson('https://api.nasa.gov/test'), { code: 'NASA_NETWORK_FAILURE' });
  assert.equal(calls, 6);
});

test('times out a stalled request without an unbounded wait', async () => {
  const client = createNasaHttpClient({
    timeoutMs: 10,
    maxRetries: 0,
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })),
  });
  await assert.rejects(client.requestJson('https://api.nasa.gov/test'), { code: 'NASA_TIMEOUT' });
});

test('preserves rate-limit response and Retry-After without retrying it', async () => {
  let calls = 0;
  const client = createNasaHttpClient({ fetchImpl: async () => { calls += 1; return jsonResponse({}, 429, { 'retry-after': '7' }); }, maxRetries: 3 });
  await assert.rejects(client.requestJson('https://api.nasa.gov/test'), (error) => error.code === 'NASA_RATE_LIMITED' && error.retryAfterMs === 7000);
  assert.equal(calls, 1);
});

test('normalizes authorization, not-found, invalid JSON and invalid schema errors', async () => {
  for (const [status, code] of [[403, 'NASA_FORBIDDEN'], [404, 'NASA_NOT_FOUND'], [429, 'NASA_RATE_LIMITED']]) {
    const client = createNasaHttpClient({ fetchImpl: async () => jsonResponse({}, status), maxRetries: 0 });
    await assert.rejects(client.requestJson('https://api.nasa.gov/test'), { code });
  }

  const invalidJson = createNasaHttpClient({ fetchImpl: async () => jsonResponse('{'), maxRetries: 0 });
  await assert.rejects(invalidJson.requestJson('https://api.nasa.gov/test'), { code: 'NASA_INVALID_JSON' });

  const adapters = createNasaAdapters({ apiKey: 'test-only', client: createNasaHttpClient({ fetchImpl: async () => jsonResponse([{ cmeID: 'wrong' }]) }) });
  await assert.rejects(adapters.cme({ startDate: '2024-01-01' }), { code: 'NASA_INVALID_RESPONSE_SCHEMA' });
});

test('keeps NASA key server-side and out of live provenance URLs', async () => {
  let requestedUrl;
  const adapters = createNasaAdapters({
    apiKey: 'unit-test-nasa-key',
    now: () => new Date('2026-11-15T00:00:00Z'),
    client: createNasaHttpClient({ fetchImpl: async (url) => { requestedUrl = new URL(url); return jsonResponse([]); } }),
  });
  const result = await adapters.gst({ startDate: '2024-05-08', endDate: '2024-05-12' });
  assert.equal(requestedUrl.searchParams.get('api_key'), 'unit-test-nasa-key');
  assert.equal(result.provenance.type, 'NASA_LIVE');
  assert.equal(new URL(result.provenance.sourceUrl).searchParams.has('api_key'), false);
  await assert.rejects(createNasaAdapters({ apiKey: '' }).cme({}), { code: 'NASA_API_KEY_MISSING' });
});

test('keeps FLR explicitly unverified and exposes reusable image operations', async () => {
  const requests = [];
  const adapters = createNasaAdapters({
    apiKey: 'server-key',
    client: createNasaHttpClient({ fetchImpl: async (url) => {
      requests.push(String(url));
      if (String(url).includes('/DONKI/FLR')) return jsonResponse({ arbitrary: 'preserved' });
      if (String(url).includes('/search')) return jsonResponse({ collection: { metadata: { total_hits: 0 }, items: [] } });
      if (String(url).includes('/asset/')) return jsonResponse({ collection: { href: 'https://images-assets.nasa.gov/image/x/collection.json', items: [] } });
      return jsonResponse({ location: 'https://images-assets.nasa.gov/image/x/metadata.json' });
    } }),
  });
  assert.deepEqual((await adapters.flrUnverified({ startDate: '2024-05-08' })).schemaStatus, 'UNVERIFIED');
  assert.deepEqual((await adapters.imageSearch({ q: 'Moon' })).data.collection.items, []);
  assert.equal((await adapters.imageAsset('id 1')).data.collection.items.length, 0);
  assert.equal((await adapters.imageMetadata('id 1')).data.location.endsWith('/metadata.json'), true);
  assert.ok(requests.every((url) => !url.includes('api_key=') || url.includes('/DONKI/FLR')));
  assert.ok(requests.some((url) => url.includes('/asset/id%201')));
});

test('rejects DEMO_KEY for production DONKI requests', async () => {
  const adapters = createNasaAdapters({ apiKey: 'DEMO_KEY', environment: 'production' });
  await assert.rejects(adapters.cme({}), { code: 'NASA_CONFIGURATION_ERROR' });
  await assert.rejects(adapters.flrUnverified({}), { code: 'NASA_CONFIGURATION_ERROR' });
});
