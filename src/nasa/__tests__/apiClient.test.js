import test from 'node:test';
import assert from 'node:assert/strict';
import { createNasaApiClient } from '../apiClient.js';

function response(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

test('uses same-origin API routes and never adds a NASA key in the browser', async () => {
  let request;
  const client = createNasaApiClient({ fetchImpl: async (url, options) => { request = { url, options }; return response({ data: [] }); } });
  await client.donki('cme', { startDate: '2024-05-08', endDate: '2024-05-12' });
  assert.match(request.url, /^\/api\/nasa\/donki\/cme\?/);
  assert.match(request.url, /startDate=2024-05-08/);
  assert.doesNotMatch(request.url, /api_key|NASA_API_KEY/);
  assert.equal(request.options.credentials, 'same-origin');
});

test('normalizes server rate-limit, invalid JSON and network responses', async () => {
  const limited = createNasaApiClient({ fetchImpl: async () => response({ error: { code: 'NASA_RATE_LIMITED', message: 'wait', retryAfterMs: 8000 } }, 429, { 'retry-after': '8' }) });
  await assert.rejects(limited.donki('gst'), { code: 'NASA_RATE_LIMITED', status: 429, retryAfterMs: 8000 });

  const invalid = createNasaApiClient({ fetchImpl: async () => new Response('{', { status: 200 }) });
  await assert.rejects(invalid.donki('cme'), { code: 'NASA_INVALID_JSON' });

  const network = createNasaApiClient({ fetchImpl: async () => { throw new TypeError('offline'); } });
  await assert.rejects(network.donki('ips'), { code: 'NASA_NETWORK_FAILURE' });
});
