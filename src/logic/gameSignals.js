const ALLOWED_CLASSIFICATIONS = new Set(['DIRECT', 'INDIRECT', 'NARRATIVE', 'DERIVED']);
const ALLOWED_TYPES = new Set(['CME', 'GST', 'SEP', 'IPS']);
const SIGNAL_KEYS = new Set(['signalId', 'ruleId', 'eventId', 'eventType', 'observedAt', 'classification', 'title', 'message', 'rationale', 'sourceUrl', 'educationalSourceUrl', 'provenance', 'effects', 'simulationEffects']);
const EFFECT_KEYS = new Set(['resources', 'crewHealth', 'equipmentCondition']);
const PROVENANCE_KEYS = new Set(['type', 'sourceUrl', 'archivedAt', 'retrievedAt']);

function hasOnlyKeys(value, allowed) {
  return value && typeof value === 'object' && Object.keys(value).every((key) => allowed.has(key));
}

function isWebUrl(value) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

/** Accept a deliberately narrow, sanitized observation annotation; never accept a raw NASA record. */
export function isGameSignal(value) {
  return Boolean(hasOnlyKeys(value, SIGNAL_KEYS)
    && typeof value.signalId === 'string'
    && typeof value.ruleId === 'string'
    && typeof value.eventId === 'string'
    && ALLOWED_TYPES.has(value.eventType)
    && ALLOWED_CLASSIFICATIONS.has(value.classification)
    && typeof value.title === 'string'
    && typeof value.message === 'string'
    && typeof value.rationale === 'string'
    && typeof value.effects === 'string'
    && (value.observedAt === null || (typeof value.observedAt === 'string' && Number.isFinite(Date.parse(value.observedAt))))
    && isWebUrl(value.sourceUrl)
    && isWebUrl(value.educationalSourceUrl)
    && hasOnlyKeys(value.provenance, PROVENANCE_KEYS)
    && ['NASA_LIVE', 'NASA_ARCHIVE'].includes(value.provenance.type)
    && isWebUrl(value.provenance.sourceUrl)
    && hasOnlyKeys(value.simulationEffects, EFFECT_KEYS)
    && value.simulationEffects.crewHealth === 0
    && value.simulationEffects.equipmentCondition === 0
    && value.simulationEffects.resources && typeof value.simulationEffects.resources === 'object'
    && Object.keys(value.simulationEffects.resources ?? {}).length === 0
    && !('sourceRecord' in value));
}

export function receiveGameSignal(state, signal) {
  if (!isGameSignal(signal) || !state || state.status !== 'active') return state;
  const current = Array.isArray(state.spaceWeatherContext) ? state.spaceWeatherContext : [];
  if (current.some((item) => item.signalId === signal.signalId)) return state;
  return { ...state, spaceWeatherContext: [...current, signal].slice(-10) };
}
