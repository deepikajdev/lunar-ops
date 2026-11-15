export class NasaApiError extends Error {
  constructor(code, message, { status = null, retryAfterMs = null, details = null, cause = null } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'NasaApiError';
    this.code = code;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.status === null ? {} : { status: this.status }),
        ...(this.retryAfterMs === null ? {} : { retryAfterMs: this.retryAfterMs }),
      },
    };
  }
}

export function normalizeHttpError(status, headers) {
  const retryAfter = headers?.get?.('retry-after');
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  const retryAfterDate = retryAfter && !Number.isFinite(seconds) ? Date.parse(retryAfter) : NaN;
  const retryAfterMs = Number.isFinite(seconds)
    ? Math.max(0, seconds * 1000)
    : Number.isFinite(retryAfterDate) ? Math.max(0, retryAfterDate - Date.now()) : null;

  if (status === 403) return new NasaApiError('NASA_FORBIDDEN', 'NASA rejected the request credentials.', { status });
  if (status === 404) return new NasaApiError('NASA_NOT_FOUND', 'The requested NASA resource was not found.', { status });
  if (status === 429) return new NasaApiError('NASA_RATE_LIMITED', 'NASA rate limit reached. Retry after the indicated delay.', { status, retryAfterMs });
  if (status >= 500) return new NasaApiError('NASA_UPSTREAM_UNAVAILABLE', 'NASA service is temporarily unavailable.', { status });
  return new NasaApiError('NASA_HTTP_ERROR', `NASA request failed with HTTP ${status}.`, { status });
}
