const ALLOWED_CLASSIFICATIONS = new Set(['DIRECT', 'INDIRECT', 'NARRATIVE', 'DERIVED']);
const ALLOWED_TYPES = new Set(['CME', 'GST', 'SEP', 'IPS']);

/** Accept a deliberately narrow, sanitized observation annotation; never accept a raw NASA record. */
export function isGameSignal(value) {
  return Boolean(value && typeof value === 'object'
    && typeof value.signalId === 'string'
    && typeof value.eventId === 'string'
    && ALLOWED_TYPES.has(value.eventType)
    && ALLOWED_CLASSIFICATIONS.has(value.classification)
    && typeof value.title === 'string'
    && typeof value.message === 'string'
    && typeof value.sourceUrl === 'string'
    && value.provenance && ['NASA_LIVE', 'NASA_ARCHIVE'].includes(value.provenance.type)
    && value.simulationEffects && value.simulationEffects.crewHealth === 0
    && Object.keys(value.simulationEffects.resources ?? {}).length === 0
    && value.simulationEffects.equipmentCondition === 0
    && !('sourceRecord' in value));
}

export function receiveGameSignal(state, signal) {
  if (!isGameSignal(signal) || !state || state.status !== 'active') return state;
  if (state.spaceWeatherContext.some((item) => item.signalId === signal.signalId)) return state;
  return { ...state, spaceWeatherContext: [...state.spaceWeatherContext, signal].slice(-10) };
}
