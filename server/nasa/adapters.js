import { NasaApiError } from './errors.js';
import { createNasaHttpClient } from './httpClient.js';
import { createProvenance } from './provenance.js';
import { validateDonkiPayload, validateImagePayload } from './schemas.js';

const DONKI_ENDPOINTS = Object.freeze({ cme: 'CME', gst: 'GST', sep: 'SEP', ips: 'IPS' });
const DONKI_QUERY_KEYS = new Set(['startDate', 'endDate', 'location', 'catalog']);
const IMAGE_SEARCH_QUERY_KEYS = new Set(['q', 'center', 'description', 'keywords', 'location', 'media_type', 'nasa_id', 'page', 'page_size', 'year_start', 'year_end', 'sort_by']);
const DONKI_BASE_URL = 'https://api.nasa.gov/DONKI/';
const IMAGES_BASE_URL = 'https://images-api.nasa.gov/';

function parametersFrom(input, allowedKeys) {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(input ?? {})) {
    if (!allowedKeys.has(key)) throw new NasaApiError('NASA_INVALID_REQUEST', `Unsupported query parameter: ${key}.`);
    if (value !== undefined && value !== null && value !== '') result.set(key, String(value));
  }
  return result;
}

function rateLimitSnapshot(headers) {
  return Object.freeze({
    limit: headers.get('x-ratelimit-limit') ?? null,
    remaining: headers.get('x-ratelimit-remaining') ?? null,
    legacyRemaining: headers.get('x-rate-limit-remaining') ?? null,
    retryAfter: headers.get('retry-after') ?? null,
  });
}

function provenanceUrl(url) {
  const safeUrl = new URL(url);
  safeUrl.searchParams.delete('api_key');
  return safeUrl.toString();
}

export function createNasaAdapters({
  apiKey = process.env.NASA_API_KEY,
  client = createNasaHttpClient(),
  now = () => new Date(),
  environment = process.env.NODE_ENV,
} = {}) {
  async function requestDonki(kind, params, { signal } = {}) {
    if (!apiKey) throw new NasaApiError('NASA_API_KEY_MISSING', 'NASA_API_KEY is not configured on the server.');
    if (environment === 'production' && apiKey === 'DEMO_KEY') {
      throw new NasaApiError('NASA_CONFIGURATION_ERROR', 'DEMO_KEY is not allowed for production DONKI requests.');
    }
    const endpoint = DONKI_ENDPOINTS[kind];
    if (!endpoint) throw new NasaApiError('NASA_SCHEMA_UNVERIFIED', `DONKI ${String(kind).toUpperCase()} has no verified response schema.`);
    const query = parametersFrom(params, DONKI_QUERY_KEYS);
    query.set('api_key', apiKey);
    const url = new URL(endpoint, DONKI_BASE_URL);
    url.search = query.toString();
    const response = await client.requestJson(url, { signal });
    const data = validateDonkiPayload(kind, response.payload);
    return Object.freeze({
      data,
      provenance: createProvenance('NASA_LIVE', { sourceUrl: provenanceUrl(url), retrievedAt: now().toISOString() }),
      rateLimit: rateLimitSnapshot(response.headers),
      status: response.status,
    });
  }

  async function requestFlrUnverified(params, { signal } = {}) {
    if (!apiKey) throw new NasaApiError('NASA_API_KEY_MISSING', 'NASA_API_KEY is not configured on the server.');
    if (environment === 'production' && apiKey === 'DEMO_KEY') {
      throw new NasaApiError('NASA_CONFIGURATION_ERROR', 'DEMO_KEY is not allowed for production DONKI requests.');
    }
    const query = parametersFrom(params, DONKI_QUERY_KEYS);
    query.set('api_key', apiKey);
    const url = new URL('FLR', DONKI_BASE_URL);
    url.search = query.toString();
    const response = await client.requestJson(url, { signal });
    return Object.freeze({
      data: response.payload,
      schemaStatus: 'UNVERIFIED',
      provenance: createProvenance('NASA_LIVE', { sourceUrl: provenanceUrl(url), retrievedAt: now().toISOString() }),
      rateLimit: rateLimitSnapshot(response.headers),
      status: response.status,
    });
  }

  async function requestImages(kind, endpoint, params = {}, { signal } = {}) {
    if (kind === 'search') parametersFrom(params, IMAGE_SEARCH_QUERY_KEYS);
    const url = new URL(endpoint, IMAGES_BASE_URL);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
    const response = await client.requestJson(url, { signal });
    const data = validateImagePayload(kind, response.payload);
    return Object.freeze({
      data,
      provenance: createProvenance('NASA_LIVE', { sourceUrl: url.toString(), retrievedAt: now().toISOString() }),
      status: response.status,
    });
  }

  return Object.freeze({
    cme: (params, options) => requestDonki('cme', params, options),
    gst: (params, options) => requestDonki('gst', params, options),
    sep: (params, options) => requestDonki('sep', params, options),
    ips: (params, options) => requestDonki('ips', params, options),
    flrUnverified: requestFlrUnverified,
    imageSearch: (params, options) => requestImages('search', 'search', params, options),
    imageAsset: (nasaId, options) => requestImages('asset', `asset/${encodeURIComponent(nasaId)}`, {}, options),
    imageMetadata: (nasaId, options) => requestImages('metadata', `metadata/${encodeURIComponent(nasaId)}`, {}, options),
  });
}
