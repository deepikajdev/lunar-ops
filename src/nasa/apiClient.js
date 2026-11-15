import { NasaApiError } from './errors.js';

export function createNasaApiClient({ fetchImpl = globalThis.fetch, basePath = '/api/nasa' } = {}) {
  async function get(path, params = {}, { signal } = {}) {
    const url = new URL(`${basePath}${path}`, globalThis.location?.origin ?? 'http://localhost');
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
    let response;
    try {
      response = await fetchImpl(`${url.pathname}${url.search}`, { method: 'GET', headers: { accept: 'application/json' }, signal, credentials: 'same-origin' });
    } catch (cause) {
      if (signal?.aborted) throw new NasaApiError('NASA_REQUEST_ABORTED', 'NASA request was cancelled.', { cause });
      throw new NasaApiError('NASA_NETWORK_FAILURE', 'The LUNAR OPS NASA service could not be reached.', { cause });
    }
    let payload;
    try {
      payload = JSON.parse(await response.text());
    } catch (cause) {
      throw new NasaApiError('NASA_INVALID_JSON', 'The LUNAR OPS NASA service returned invalid JSON.', { status: response.status, cause });
    }
    if (!response.ok) {
      const remote = payload?.error ?? {};
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfterMs = Number.isFinite(Number(remote.retryAfterMs))
        ? Number(remote.retryAfterMs)
        : retryAfterHeader && Number.isFinite(Number(retryAfterHeader)) ? Number(retryAfterHeader) * 1000 : null;
      throw new NasaApiError(remote.code ?? 'NASA_HTTP_ERROR', remote.message ?? `NASA service returned HTTP ${response.status}.`, {
        status: response.status,
        retryAfterMs,
      });
    }
    return payload;
  }

  return Object.freeze({
    donki: (kind, params, options) => get(`/donki/${encodeURIComponent(kind)}`, params, options),
    imageSearch: (params, options) => get('/images/search', params, options),
    imageAsset: (nasaId, options) => get(`/images/asset/${encodeURIComponent(nasaId)}`, {}, options),
    imageMetadata: (nasaId, options) => get(`/images/metadata/${encodeURIComponent(nasaId)}`, {}, options),
  });
}
