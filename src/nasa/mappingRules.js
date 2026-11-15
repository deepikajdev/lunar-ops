/**
 * Conservative links from verified observations to educational game context.
 * These rules produce annotations only; they never change game state.
 */
export const MAPPING_RULES = Object.freeze({
  SEP: Object.freeze({
    id: 'sep-radiation-context-v1', classification: 'INDIRECT',
    title: 'Radiation context review',
    message: 'A NASA SEP observation is available. Review the crew radiation and shelter discussion as an educational prompt.',
    rationale: 'Energetic particles can present radiation hazards to astronauts; the cataloged DONKI event is not a local lunar dose measurement or a dose forecast for this outpost.',
    sourceUrl: 'https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/',
    effects: 'Informational only. No modeled dose, protection benefit, or crew-health effect is calculated.',
  }),
  CME: Object.freeze({
    id: 'cme-solar-activity-v1', classification: 'NARRATIVE',
    title: 'Solar activity observation',
    message: 'A coronal mass ejection appears in the NASA event archive. Inspect its linked observations and uncertainty.',
    rationale: 'A CME is an ejection of solar plasma and magnetic field; this record alone does not establish a lunar outpost hazard or equipment consequence.',
    sourceUrl: 'https://science.nasa.gov/sun/solar-storms-and-flares/',
    effects: 'Narrative context only; no equipment or resource effects.',
  }),
  GST: Object.freeze({
    id: 'gst-earth-index-context-v1', classification: 'NARRATIVE',
    title: 'Earth geomagnetic index context',
    message: 'NASA reports a geomagnetic storm record. Associated Kp values describe Earth geomagnetic activity, not local lunar conditions.',
    rationale: 'Kp is derived from ground magnetometer observations and characterizes geomagnetic disturbance at Earth; it is not transferable as a lunar surface measurement.',
    sourceUrl: 'https://www.swpc.noaa.gov/products/planetary-k-index',
    effects: 'Narrative context only; no lunar hazard or equipment effects.',
  }),
  IPS: Object.freeze({
    id: 'ips-interplanetary-context-v1', classification: 'NARRATIVE',
    title: 'Interplanetary propagation context',
    message: 'An interplanetary shock record is available. Compare its event links and observation times without assuming a local outpost impact.',
    rationale: 'DONKI event associations are catalog relationships; without a validated lunar location and environment model, they do not quantify local exposure or system impact.',
    sourceUrl: 'https://science.nasa.gov/heliophysics/resources/vocabulary/',
    effects: 'Narrative context only; no resource, equipment, or crew effects.',
  }),
});

export const UNMAPPED_EVENT_TYPES = Object.freeze({
  FLR: Object.freeze({ status: 'SCHEMA_UNVERIFIED', reason: 'M0 did not verify a stable FLR response schema; no mapping is attempted.' }),
});

export function mapEventToGameSignal(event) {
  if (!event || typeof event !== 'object' || typeof event.id !== 'string' || !event.provenance || !event.sourceUrl) return null;
  const rule = MAPPING_RULES[event.eventType];
  if (!rule) return null;
  return Object.freeze({
    signalId: `${rule.id}:${event.id}`,
    ruleId: rule.id,
    eventId: event.id,
    eventType: event.eventType,
    observedAt: event.observedAt,
    classification: rule.classification,
    title: rule.title,
    message: rule.message,
    rationale: rule.rationale,
    sourceUrl: event.sourceUrl,
    educationalSourceUrl: rule.sourceUrl,
    provenance: event.provenance,
    effects: rule.effects,
    simulationEffects: Object.freeze({ resources: Object.freeze({}), crewHealth: 0, equipmentCondition: 0 }),
  });
}

export function mapEventsToGameSignals(events) {
  return events.map(mapEventToGameSignal).filter(Boolean);
}
