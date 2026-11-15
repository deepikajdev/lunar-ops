export const PROVENANCE_TYPES = Object.freeze(['NASA_LIVE', 'NASA_ARCHIVE', 'DERIVED', 'SIMULATED']);

export function createProvenance(type, attributes = {}) {
  if (!PROVENANCE_TYPES.includes(type)) throw new TypeError(`Unknown provenance type: ${type}`);
  const provenance = { type, ...attributes };
  if (type === 'NASA_LIVE' && (!provenance.sourceUrl || !provenance.retrievedAt)) {
    throw new TypeError('NASA_LIVE provenance requires sourceUrl and retrievedAt.');
  }
  if (type === 'NASA_ARCHIVE' && (!provenance.sourceUrl || !provenance.archivedAt)) {
    throw new TypeError('NASA_ARCHIVE provenance requires sourceUrl and archivedAt.');
  }
  if (type === 'DERIVED' && !provenance.calculation) {
    throw new TypeError('DERIVED provenance requires a calculation description.');
  }
  if (type === 'SIMULATED' && !provenance.model) {
    throw new TypeError('SIMULATED provenance requires a model description.');
  }
  return Object.freeze(provenance);
}
