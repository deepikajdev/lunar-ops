import { NASA_EVENT_SNAPSHOTS } from '../data/nasaSnapshots.js';
import { normalizeDonkiEvents } from './normalize.js';
import { NasaApiError } from './errors.js';
import { MemoryCache, IndexedDbCache } from './cache.js';
import { createNasaApiClient } from './apiClient.js';

const EVENT_KINDS = Object.freeze(['cme', 'gst', 'sep', 'ips']);
const CACHE_NAMESPACE = 'lunar-ops:nasa:v1';
const DEFAULT_RATE_LIMIT_HOLD_MS = 5 * 60 * 1000;

function looksLikeNormalizedEvent(event) {
  return event !== null && typeof event === 'object'
    && typeof event.id === 'string'
    && typeof event.eventType === 'string'
    && (event.observedAt === null || typeof event.observedAt === 'string')
    && Array.isArray(event.magnitude)
    && event.provenance && ['NASA_LIVE', 'NASA_ARCHIVE'].includes(event.provenance.type)
    && event.sourceRecord && typeof event.sourceRecord === 'object';
}

function makeArchiveSnapshot(kind, snapshots) {
  const snapshot = snapshots[kind];
  if (!snapshot) return null;
  const normalized = normalizeDonkiEvents(kind, snapshot.records, snapshot.provenance);
  return {
    events: normalized.events,
    rejectedCount: normalized.rejected.length,
    fetchedAt: snapshot.provenance.archivedAt,
    savedAtMs: 0,
    provenance: snapshot.provenance,
  };
}

function eventResult(entry, { mode, requestedMode = mode, delivery, stale = false, fallbackReason = null, rateLimitedUntil = null }) {
  return {
    events: entry.events,
    mode,
    requestedMode,
    delivery,
    stale,
    rejectedCount: entry.rejectedCount ?? 0,
    lastFetchedAt: entry.fetchedAt ?? entry.provenance?.archivedAt ?? null,
    provenance: entry.provenance ?? entry.events[0]?.provenance ?? null,
    fallbackReason,
    rateLimitedUntil,
  };
}

export function createEventRepository({
  apiClient = createNasaApiClient(),
  memoryCache = new MemoryCache(),
  persistentCache = new IndexedDbCache(),
  snapshots = NASA_EVENT_SNAPSHOTS,
  ttlMs = 15 * 60 * 1000,
  now = () => Date.now(),
  getLiveDateRange = () => {
    const end = new Date(now());
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
  },
  isOnline = () => globalThis.navigator?.onLine !== false,
  onUpdate = () => {},
} = {}) {
  const rateLimits = new Map();
  const inFlight = new Map();

  const cacheKey = (kind) => `${CACHE_NAMESPACE}:events:${kind}`;
  const rateKey = (kind) => `${CACHE_NAMESPACE}:rate:${kind}`;

  async function safeGet(cache, key) {
    try { return await cache.get(key); } catch { return null; }
  }

  async function safeSet(cache, key, value) {
    try { await cache.set(key, value); return true; } catch { return false; }
  }

  async function removeBadEntry(cache, key) {
    try { await cache.delete(key); } catch { /* A failed cache delete must not block fixture fallback. */ }
  }

  function isValidEntry(entry) {
    return entry && Array.isArray(entry.events) && entry.events.every(looksLikeNormalizedEvent)
      && typeof entry.savedAtMs === 'number';
  }

  async function readEventEntry(cache, kind) {
    const key = cacheKey(kind);
    const entry = await safeGet(cache, key);
    if (entry === null) return null;
    if (!isValidEntry(entry)) {
      await removeBadEntry(cache, key);
      return null;
    }
    return entry;
  }

  async function readRateLimit(kind) {
    const nowMs = now();
    const memoryUntil = rateLimits.get(kind) ?? 0;
    if (memoryUntil > nowMs) return memoryUntil;
    const stored = await safeGet(persistentCache, rateKey(kind));
    const until = Number(stored?.untilMs) || 0;
    if (until > nowMs) {
      rateLimits.set(kind, until);
      return until;
    }
    if (stored) await removeBadEntry(persistentCache, rateKey(kind));
    rateLimits.delete(kind);
    return 0;
  }

  async function recordRateLimit(kind, error) {
    const untilMs = now() + (Number.isFinite(error.retryAfterMs) && error.retryAfterMs > 0 ? error.retryAfterMs : DEFAULT_RATE_LIMIT_HOLD_MS);
    rateLimits.set(kind, untilMs);
    const value = { untilMs, code: error.code };
    await safeSet(memoryCache, rateKey(kind), value);
    await safeSet(persistentCache, rateKey(kind), value);
    return untilMs;
  }

  async function cacheEntry(kind, entry) {
    await safeSet(memoryCache, cacheKey(kind), entry);
    await safeSet(persistentCache, cacheKey(kind), entry);
  }

  function isFresh(entry) {
    return entry.savedAtMs > 0 && now() - entry.savedAtMs < ttlMs;
  }

  async function fetchLive(kind, signal) {
    const response = await apiClient.donki(kind, getLiveDateRange(), { signal });
    if (!response || !Array.isArray(response.data) || !response.provenance || response.provenance.type !== 'NASA_LIVE') {
      throw new NasaApiError('NASA_INVALID_RESPONSE_SCHEMA', 'The server returned an invalid NASA event envelope.');
    }
    const normalized = normalizeDonkiEvents(kind, response.data, response.provenance);
    if (response.data.length > 0 && normalized.events.length === 0) {
      throw new NasaApiError('NASA_INVALID_RESPONSE_SCHEMA', 'No NASA events passed normalization.');
    }
    const fetchedAt = response.provenance.retrievedAt ?? new Date(now()).toISOString();
    const entry = {
      events: normalized.events,
      rejectedCount: normalized.rejected.length,
      fetchedAt,
      savedAtMs: now(),
      provenance: response.provenance,
    };
    await cacheEntry(kind, entry);
    return entry;
  }

  async function fallbackEntry(kind, { mode, requestedMode, error = null, rateLimitedUntil = null } = {}) {
    if (mode === 'REPLAY') {
      const snapshot = makeArchiveSnapshot(kind, snapshots);
      if (snapshot) return eventResult(snapshot, { mode: 'REPLAY', requestedMode, delivery: 'BUNDLED_NASA_ARCHIVE' });
    }
    const cachedMemory = await readEventEntry(memoryCache, kind);
    if (cachedMemory) {
      return eventResult(cachedMemory, {
        mode: mode === 'REPLAY' ? 'REPLAY' : 'OFFLINE', requestedMode, delivery: 'MEMORY_CACHE',
        stale: !isFresh(cachedMemory), fallbackReason: error?.code ?? null, rateLimitedUntil,
      });
    }
    const cachedDisk = await readEventEntry(persistentCache, kind);
    if (cachedDisk) {
      await safeSet(memoryCache, cacheKey(kind), cachedDisk);
      return eventResult(cachedDisk, {
        mode: mode === 'REPLAY' ? 'REPLAY' : 'OFFLINE', requestedMode, delivery: 'INDEXED_DB',
        stale: !isFresh(cachedDisk), fallbackReason: error?.code ?? null, rateLimitedUntil,
      });
    }
    const snapshot = makeArchiveSnapshot(kind, snapshots);
    if (snapshot) {
      await safeSet(memoryCache, cacheKey(kind), snapshot);
      return eventResult(snapshot, {
        mode: mode === 'REPLAY' ? 'REPLAY' : 'OFFLINE', requestedMode,
        delivery: 'BUNDLED_NASA_ARCHIVE', fallbackReason: error?.code ?? null, rateLimitedUntil,
      });
    }
    return {
      events: [], mode: 'OFFLINE', requestedMode, delivery: 'SIMULATED_EMPTY', stale: false,
      rejectedCount: 0, lastFetchedAt: null, provenance: { type: 'SIMULATED', model: 'Empty offline fallback; contains no NASA observation.' },
      fallbackReason: error?.code ?? 'NASA_OFFLINE', rateLimitedUntil,
      demonstration: { label: 'SIMULATED · NO VERIFIED SNAPSHOT AVAILABLE', message: 'This placeholder contains no NASA event and has no simulation effects.' },
    };
  }

  async function refresh(kind, options = {}) {
    if (inFlight.has(kind)) return inFlight.get(kind);
    const pending = fetchLive(kind, options.signal).then((entry) => {
      const result = eventResult(entry, { mode: 'LIVE', requestedMode: 'LIVE', delivery: 'NASA_LIVE', stale: false });
      onUpdate(kind, result);
      return result;
    }).finally(() => inFlight.delete(kind));
    inFlight.set(kind, pending);
    return pending;
  }

  async function getEvents(kind, { mode = 'LIVE', forceRefresh = false, signal } = {}) {
    if (!EVENT_KINDS.includes(kind)) throw new NasaApiError('NASA_INVALID_REQUEST', `Unsupported event type: ${kind}.`);
    if (!['LIVE', 'REPLAY', 'OFFLINE'].includes(mode)) throw new NasaApiError('NASA_INVALID_REQUEST', `Unsupported data mode: ${mode}.`);
    if (mode === 'REPLAY') return fallbackEntry(kind, { mode, requestedMode: mode });

    const cachedMemory = await readEventEntry(memoryCache, kind);
    const cachedDisk = cachedMemory ? null : await readEventEntry(persistentCache, kind);
    if (cachedDisk) await safeSet(memoryCache, cacheKey(kind), cachedDisk);
    const online = isOnline();
    if (mode === 'OFFLINE' || !online) {
      return fallbackEntry(kind, { mode: 'OFFLINE', requestedMode: mode, error: online ? null : new NasaApiError('NASA_OFFLINE', 'Network is offline.') });
    }

    const rateLimitedUntil = await readRateLimit(kind);
    const cachedEntry = cachedMemory ?? cachedDisk;
    if (cachedEntry && !forceRefresh) {
      const delivery = cachedMemory ? 'MEMORY_CACHE' : 'INDEXED_DB';
      if (isFresh(cachedEntry)) return eventResult(cachedEntry, { mode: 'LIVE', requestedMode: mode, delivery, stale: false, rateLimitedUntil: rateLimitedUntil || null });
      const refreshPromise = rateLimitedUntil > now() ? null : refresh(kind, { signal }).catch(async (error) => {
        const retryAt = error.code === 'NASA_RATE_LIMITED' ? await recordRateLimit(kind, error) : rateLimitedUntil;
        const fallback = await fallbackEntry(kind, { mode: 'OFFLINE', requestedMode: mode, error, rateLimitedUntil: retryAt || null });
        onUpdate(kind, fallback);
        return fallback;
      });
      return { ...eventResult(cachedEntry, { mode: 'LIVE', requestedMode: mode, delivery, stale: true, rateLimitedUntil: rateLimitedUntil || null }), refreshPromise };
    }

    if (rateLimitedUntil > now()) {
      return fallbackEntry(kind, { mode: 'OFFLINE', requestedMode: mode, error: new NasaApiError('NASA_RATE_LIMITED', 'Live requests are paused after a rate-limit response.'), rateLimitedUntil });
    }

    try {
      return await refresh(kind, { signal });
    } catch (error) {
      const retryAt = error.code === 'NASA_RATE_LIMITED' ? await recordRateLimit(kind, error) : null;
      return fallbackEntry(kind, { mode: 'OFFLINE', requestedMode: mode, error, rateLimitedUntil: retryAt });
    }
  }

  async function getMany(kinds = EVENT_KINDS, options = {}) {
    const results = await Promise.all(kinds.map((kind) => getEvents(kind, options)));
    return results.flatMap((result) => result.events);
  }

  return Object.freeze({ getEvents, getMany, refresh, eventKinds: EVENT_KINDS });
}
