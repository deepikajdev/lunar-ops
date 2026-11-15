import { createServer as createHttpServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { createNasaAdapters } from './nasa/adapters.js';
import { NasaApiError } from './nasa/errors.js';

function json(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload));
}

function queryObject(url) {
  const params = {};
  for (const [key, value] of url.searchParams) params[key] = value;
  return params;
}

function statusForError(error) {
  if (error.code === 'NASA_API_KEY_MISSING') return 503;
  if (error.code === 'NASA_CONFIGURATION_ERROR') return 503;
  if (error.code === 'NASA_INVALID_REQUEST' || error.code === 'NASA_SCHEMA_UNVERIFIED') return 400;
  if (error.code === 'NASA_FORBIDDEN') return 403;
  if (error.code === 'NASA_NOT_FOUND') return 404;
  if (error.code === 'NASA_RATE_LIMITED') return 429;
  if (error.code === 'NASA_INVALID_JSON' || error.code === 'NASA_INVALID_RESPONSE_SCHEMA') return 502;
  if (error.code === 'NASA_TIMEOUT') return 504;
  if (error.code === 'NASA_NETWORK_FAILURE' || error.code === 'NASA_UPSTREAM_UNAVAILABLE') return 502;
  return 500;
}

export function createNasaRequestHandler({ adapters = createNasaAdapters() } = {}) {
  return async (request, response) => {
    if (request.method !== 'GET') return json(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET is supported.' } });
    const url = new URL(request.url, 'http://localhost');
    try {
      let result;
      const donkiMatch = url.pathname.match(/^\/api\/nasa\/donki\/(cme|gst|sep|ips|flr)$/);
      if (donkiMatch) {
        const [, kind] = donkiMatch;
        result = kind === 'flr'
          ? await adapters.flrUnverified(queryObject(url))
          : await adapters[kind](queryObject(url));
      } else if (url.pathname === '/api/nasa/images/search') {
        const params = Object.fromEntries(url.searchParams);
        const allowed = new Set(['q', 'center', 'description', 'keywords', 'location', 'media_type', 'nasa_id', 'page', 'page_size', 'year_start', 'year_end', 'sort_by']);
        for (const key of Object.keys(params)) if (!allowed.has(key)) throw new NasaApiError('NASA_INVALID_REQUEST', `Unsupported image search parameter: ${key}.`);
        if (!params.q && !params.nasa_id) throw new NasaApiError('NASA_INVALID_REQUEST', 'Image search requires q or nasa_id.');
        result = await adapters.imageSearch(params);
      } else {
        const imageMatch = url.pathname.match(/^\/api\/nasa\/images\/(asset|metadata)\/(.+)$/);
        if (!imageMatch) return json(response, 404, { error: { code: 'ROUTE_NOT_FOUND', message: 'NASA API route not found.' } });
        const [, kind, encodedId] = imageMatch;
        let nasaId;
        try { nasaId = decodeURIComponent(encodedId); } catch { throw new NasaApiError('NASA_INVALID_REQUEST', 'Invalid NASA ID.'); }
        if (nasaId.length > 180 || /[\\/\u0000-\u001f?#]/.test(nasaId)) throw new NasaApiError('NASA_INVALID_REQUEST', 'Invalid NASA ID.');
        result = kind === 'asset' ? await adapters.imageAsset(nasaId) : await adapters.imageMetadata(nasaId);
      }
      return json(response, 200, result);
    } catch (error) {
      const normalized = error instanceof NasaApiError
        ? error
        : new NasaApiError('NASA_INTERNAL_ERROR', 'NASA request failed unexpectedly.');
      const rateHeaders = normalized.retryAfterMs === null ? {} : { 'retry-after': String(Math.ceil(normalized.retryAfterMs / 1000)) };
      return json(response, statusForError(normalized), normalized.toJSON(), rateHeaders);
    }
  };
}

export function createNasaServer(options) {
  return createHttpServer(createNasaRequestHandler(options));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.NASA_API_PORT ?? 8787);
  const host = process.env.NASA_API_HOST ?? '127.0.0.1';
  createNasaServer().listen(port, host, () => process.stdout.write(`NASA API proxy listening on http://${host}:${port}\n`));
}
