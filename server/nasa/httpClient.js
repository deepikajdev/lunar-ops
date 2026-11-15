import { NasaApiError, normalizeHttpError } from '../../src/nasa/errors.js';
import { parseJsonResponse } from '../../src/nasa/schemas.js';

const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

function retryDelay(attempt, baseDelayMs, maxDelayMs, random) {
  const ceiling = Math.min(maxDelayMs, baseDelayMs * (2 ** attempt));
  return Math.floor(random() * ceiling);
}

export function createNasaHttpClient({
  fetchImpl = globalThis.fetch,
  timeoutMs = 8_000,
  maxRetries = 2,
  baseDelayMs = 300,
  maxDelayMs = 4_000,
  random = Math.random,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('A fetch implementation is required.');
  const retryLimit = Number.isFinite(maxRetries) ? Math.min(5, Math.max(0, Math.floor(maxRetries))) : 2;

  async function requestJson(url, { headers = {}, signal } = {}) {
    for (let attempt = 0; ; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new DOMException('Request timed out.', 'TimeoutError')), timeoutMs);
      const abortFromCaller = () => controller.abort(signal.reason);
      signal?.addEventListener('abort', abortFromCaller, { once: true });
      try {
        let response;
        try {
          response = await fetchImpl(url, { method: 'GET', headers, signal: controller.signal });
        } catch (cause) {
          if (controller.signal.aborted) {
            if (signal?.aborted) throw new NasaApiError('NASA_REQUEST_ABORTED', 'NASA request was cancelled.', { cause });
            if (attempt < retryLimit) {
              await sleep(retryDelay(attempt, baseDelayMs, maxDelayMs, random));
              continue;
            }
            throw new NasaApiError('NASA_TIMEOUT', 'NASA request timed out.', { cause });
          }
          if (attempt < retryLimit) {
            await sleep(retryDelay(attempt, baseDelayMs, maxDelayMs, random));
            continue;
          }
          throw new NasaApiError('NASA_NETWORK_FAILURE', 'Could not connect to NASA.', { cause });
        }

        if (!response.ok) {
          const error = normalizeHttpError(response.status, response.headers);
          await response.body?.cancel();
          if (RETRYABLE_STATUSES.has(response.status) && attempt < retryLimit) {
            const retryHeader = response.headers.get('retry-after');
            const serverDelay = retryHeader && Number.isFinite(Number(retryHeader)) ? Number(retryHeader) * 1000 : null;
            await sleep(serverDelay ?? retryDelay(attempt, baseDelayMs, maxDelayMs, random));
            continue;
          }
          throw error;
        }

        let payload;
        try {
          payload = parseJsonResponse(await response.text());
        } catch (cause) {
          if (cause instanceof NasaApiError) throw cause;
          if (attempt < retryLimit) {
            await sleep(retryDelay(attempt, baseDelayMs, maxDelayMs, random));
            continue;
          }
          throw new NasaApiError('NASA_NETWORK_FAILURE', 'Could not read the NASA response.', { cause });
        }
        return { payload, headers: response.headers, status: response.status };
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abortFromCaller);
      }
    }
  }

  return Object.freeze({ requestJson });
}

export { retryDelay };
