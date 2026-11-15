import test from 'node:test';
import assert from 'node:assert/strict';
import { createNasaRequestHandler } from '../index.js';
import { NasaApiError } from '../../src/nasa/errors.js';

async function invoke(handler, method, url) {
  const response = {
    status: null,
    headers: null,
    body: null,
    writeHead(status, headers) { this.status = status; this.headers = headers; },
    end(body) { this.body = body; },
  };
  await handler({ method, url }, response);
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
