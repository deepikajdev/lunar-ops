import test from 'node:test';
import assert from 'node:assert/strict';
import { createNasaRequestHandler } from '../index.js';
import { NasaApiError } from '../../src/nasa/errors.js';

async function invoke(handler, method, url, { origin, remoteAddress } = {}) {
  const response = {
    status: null,
    headers: null,
    body: null,
    writeHead(status, headers) { this.status = status; this.headers = headers; },
    end(body) { this.body = body; },
  };
  const request = { method, url, headers: origin ? { origin } : {} };
  if (remoteAddress) request.socket = { remoteAddress };
  await handler(request, response);
  return { ...response, json: JSON.parse(response.body) };
}

test('serves normalized adapter data without enabling cross-origin browser access', async () => {
  const adapters = {
    cme: async (params) => ({ data: [], requestedRange: params.startDate }),
    gst: async () => ({ data: [] }),
    sep: async () => ({ data: [] }),
    ips: async () => ({ data: [] }),
    flrUnverified: async () => ({ data: { opaque: true }, schemaStatus: 'UNVERIFIED' }),
    imageSearch: async () => ({ data: { collection: { metadata: { total_hits: 0 }, items: [] } } }),
    imageAsset: async (id) => ({ data: { id } }),
    imageMetadata: async (id) => ({ data: { id } }),
  };

  const handler = createNasaRequestHandler({ adapters });
  const response = await invoke(handler, 'GET', '/api/nasa/donki/cme?startDate=2024-05-08');
  assert.equal(response.status, 200);
  assert.equal(response.headers['access-control-allow-origin'], undefined);
  assert.deepEqual(response.json, { data: [], requestedRange: '2024-05-08' });
  assert.deepEqual((await invoke(handler, 'GET', '/api/nasa/donki/flr')).json, { data: { opaque: true }, schemaStatus: 'UNVERIFIED' });
  assert.equal((await invoke(handler, 'GET', '/api/nasa/images/asset/a%20b')).status, 200);
  assert.equal((await invoke(handler, 'GET', '/api/nasa/images/search')).status, 400);
  assert.equal((await invoke(handler, 'GET', '/api/nasa/not-a-route')).status, 404);
  assert.equal((await invoke(handler, 'POST', '/api/nasa/donki/cme')).status, 405);
});

test('limits request bursts, validates URL size, and only returns CORS headers for allowlisted origins', async () => {
  let now = 0;
  const adapters = { cme: async () => ({ data: [] }), gst: async () => ({}), sep: async () => ({}), ips: async () => ({}), flrUnverified: async () => ({}), imageSearch: async () => ({}), imageAsset: async () => ({}), imageMetadata: async () => ({}) };
  const handler = createNasaRequestHandler({ adapters, allowedOrigins: ['https://mission.example'], rateLimit: { windowMs: 10_000, maxRequests: 1 }, maxUrlLength: 80, now: () => now });
  const allowed = await invoke(handler, 'GET', '/api/nasa/donki/cme', { origin: 'https://mission.example', remoteAddress: '198.51.100.2' });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers['access-control-allow-origin'], 'https://mission.example');
  const limited = await invoke(handler, 'GET', '/api/nasa/donki/cme', { remoteAddress: '198.51.100.2' });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers['retry-after'], '10');
  now = 11_000;
  assert.equal((await invoke(handler, 'GET', `/api/nasa/donki/cme?x=${'a'.repeat(100)}`)).status, 414);
  const denied = await invoke(handler, 'OPTIONS', '/api/nasa/donki/cme', { origin: 'https://untrusted.example' });
  assert.equal(denied.status, 403);
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
});

test('maps missing credentials and 429 to safe HTTP errors', async () => {
  const adapters = {
    cme: async () => { throw new NasaApiError('NASA_API_KEY_MISSING', 'NASA_API_KEY is not configured on the server.'); },
    gst: async () => { throw new NasaApiError('NASA_RATE_LIMITED', 'Rate limited.', { status: 429, retryAfterMs: 5000 }); },
    sep: async () => {}, ips: async () => {}, flrUnverified: async () => {},
    imageSearch: async () => {}, imageAsset: async () => {}, imageMetadata: async () => {},
  };
  const handler = createNasaRequestHandler({ adapters });
  const missing = await invoke(handler, 'GET', '/api/nasa/donki/cme');
  assert.equal(missing.status, 503);
  assert.equal(missing.json.error.code, 'NASA_API_KEY_MISSING');
  const limited = await invoke(handler, 'GET', '/api/nasa/donki/gst');
  assert.equal(limited.status, 429);
  assert.equal(limited.headers['retry-after'], '5');
});
