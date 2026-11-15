// Event values and probabilities are illustrative game rules, not lunar forecasts.
export const EVENT_CATALOG = Object.freeze([
  Object.freeze({
    id: 'solar-storm-warning',
    name: 'Solar storm warning',
    description: 'A simulated radiation-weather alert calls for a crew safety posture review.',
    severity: 'warning',
    trigger: Object.freeze({ probability: 0.07, earliestDay: 2 }),
    effects: Object.freeze({ crewHealthDelta: -7, resourceDeltas: Object.freeze({ power: -3 }), continuityDelta: -1 }),
    responses: Object.freeze({ emergency_shelter: Object.freeze({ label: 'Move crew to shelter', mitigation: Object.freeze({ crewHealthDelta: 5, continuityDelta: 1 }) }) }),
  }),
  Object.freeze({
    id: 'power-malfunction',
    name: 'Power malfunction',
    description: 'A simulated fault lowers the backup power system output until inspected.',
    severity: 'critical',
    trigger: Object.freeze({ probability: 0.07, earliestDay: 1 }),
    effects: Object.freeze({ resourceDeltas: Object.freeze({ power: -16 }), equipmentDeltas: Object.freeze({ 'backup-generator': -12 }), continuityDelta: -2 }),
    responses: Object.freeze({ emergency_power: Object.freeze({ label: 'Deploy emergency power', mitigation: Object.freeze({ resourceDeltas: Object.freeze({ power: 6 }), equipmentDeltas: Object.freeze({ 'backup-generator': 8 }), continuityDelta: 1 }) }), repair_systems: Object.freeze({ label: 'Repair generator', mitigation: Object.freeze({ resourceDeltas: Object.freeze({ power: 10 }), equipmentDeltas: Object.freeze({ 'backup-generator': 10 }), continuityDelta: 2 }) }) }),
  }),
  Object.freeze({
    id: 'water-recycling-failure',
    name: 'Water recycling failure',
    description: 'The simulated recycling unit stalls, reducing water regeneration for this day.',
    severity: 'warning',
    trigger: Object.freeze({ probability: 0.06, earliestDay: 1 }),
    effects: Object.freeze({ productionDeltas: Object.freeze({ water: -5 }), equipmentDeltas: Object.freeze({ 'water-recycler': -12 }), continuityDelta: -1 }),
    responses: Object.freeze({ repair_systems: Object.freeze({ label: 'Repair the recycler', mitigation: Object.freeze({ productionDeltas: Object.freeze({ water: 4 }), equipmentDeltas: Object.freeze({ 'water-recycler': 9 }), continuityDelta: 1 }) }), water_conservation: Object.freeze({ label: 'Conserve water', mitigation: Object.freeze({ resourceDeltas: Object.freeze({ water: 4 }), continuityDelta: 1 }) }) }),
  }),
  Object.freeze({
    id: 'oxygen-leak',
    name: 'Oxygen leak',
    description: 'A simulated seal fault causes a temporary oxygen loss and crew-safety concern.',
    severity: 'critical',
    trigger: Object.freeze({ probability: 0.05, earliestDay: 2 }),
    effects: Object.freeze({ resourceDeltas: Object.freeze({ oxygen: -18 }), equipmentDeltas: Object.freeze({ 'oxygen-recycler': -10 }), crewHealthDelta: -10, continuityDelta: -2 }),
    responses: Object.freeze({ oxygen_priority: Object.freeze({ label: 'Prioritize oxygen systems', mitigation: Object.freeze({ resourceDeltas: Object.freeze({ oxygen: 10 }), equipmentDeltas: Object.freeze({ 'oxygen-recycler': 5 }), crewHealthDelta: 5, continuityDelta: 1 }) }), repair_systems: Object.freeze({ label: 'Seal and repair', mitigation: Object.freeze({ resourceDeltas: Object.freeze({ oxygen: 8 }), equipmentDeltas: Object.freeze({ 'oxygen-recycler': 8 }), crewHealthDelta: 3, continuityDelta: 1 }) }) }),
  }),
  Object.freeze({
    id: 'equipment-overheating',
    name: 'Equipment overheating',
    description: 'A simulated thermal warning places added strain on habitat systems.',
    severity: 'warning',
    trigger: Object.freeze({ probability: 0.05, earliestDay: 2 }),
    effects: Object.freeze({ resourceDeltas: Object.freeze({ power: -5 }), equipmentDeltas: Object.freeze({ 'habitat-systems': -12 }), continuityDelta: -1 }),
    responses: Object.freeze({ reduced_operations: Object.freeze({ label: 'Reduce non-essential loads', mitigation: Object.freeze({ resourceDeltas: Object.freeze({ power: 3 }), equipmentDeltas: Object.freeze({ 'habitat-systems': 6 }), continuityDelta: 1 }) }), repair_systems: Object.freeze({ label: 'Cool and inspect systems', mitigation: Object.freeze({ equipmentDeltas: Object.freeze({ 'habitat-systems': 9 }), continuityDelta: 1 }) }) }),
  }),
  Object.freeze({
    id: 'communication-disruption',
    name: 'Communication disruption',
    description: 'A simulated relay interruption delays coordination with ground control.',
    severity: 'advisory',
    trigger: Object.freeze({ probability: 0.06, earliestDay: 1 }),
    effects: Object.freeze({ continuityDelta: -8 }),
    responses: Object.freeze({ delay_activity: Object.freeze({ label: 'Pause field activity and restore relay', mitigation: Object.freeze({ continuityDelta: 6 }) }), repair_systems: Object.freeze({ label: 'Run communications diagnostics', mitigation: Object.freeze({ continuityDelta: 7, equipmentDeltas: Object.freeze({ 'habitat-systems': 2 }) }) }) }),
  }),
  Object.freeze({
    id: 'solar-panel-dust',
    name: 'Dust on solar panels',
    description: 'Simulated dust buildup reduces the solar array output for this day.',
    severity: 'advisory',
    trigger: Object.freeze({ probability: 0.07, earliestDay: 1 }),
    effects: Object.freeze({ productionDeltas: Object.freeze({ power: -12 }), equipmentDeltas: Object.freeze({ 'solar-array': -10 }), continuityDelta: -1 }),
    responses: Object.freeze({ repair_systems: Object.freeze({ label: 'Clear and inspect the array', mitigation: Object.freeze({ productionDeltas: Object.freeze({ power: 8 }), equipmentDeltas: Object.freeze({ 'solar-array': 7 }), continuityDelta: 1 }) }), reduced_operations: Object.freeze({ label: 'Reduce non-essential loads', mitigation: Object.freeze({ continuityDelta: 1 }) }) }),
  }),
]);

function seededUnit(seed, day, salt) {
  let value = (seed ^ Math.imul(day + salt, 0x45d9f3b)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  return value / 0x100000000;
}

export function getEventForDay(seed, day, previousEventId = null) {
  const eligible = EVENT_CATALOG.filter((event) => day >= event.trigger.earliestDay && event.id !== previousEventId);
  const eventChance = eligible.reduce((total, event) => total + event.trigger.probability, 0);
  if (!eligible.length || seededUnit(seed, day, 0) >= eventChance) return null;

  let target = seededUnit(seed, day, 1) * eventChance;
  for (const event of eligible) {
    target -= event.trigger.probability;
    if (target < 0) return event;
  }
  return eligible.at(-1) ?? null;
}

export function getEventById(eventId) {
  return EVENT_CATALOG.find((event) => event.id === eventId) ?? null;
}
