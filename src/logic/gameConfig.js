// These values are game-balance assumptions, not measurements or operating guidance.
export const GAME_CONFIG = Object.freeze({
  maxDays: 10,
  defaultSeed: 2026,
  warningHealth: 35,
  criticalEquipment: 25,
  baselineEquipmentWear: 1,
  resources: Object.freeze({
    oxygen: Object.freeze({ label: 'Oxygen', current: 92, max: 100, dailyUsage: 10, production: 4, warningThreshold: 30, unit: 'pts' }),
    water: Object.freeze({ label: 'Water', current: 88, max: 100, dailyUsage: 11, production: 7, warningThreshold: 28, unit: 'pts' }),
    food: Object.freeze({ label: 'Food', current: 93, max: 100, dailyUsage: 8, production: 0, warningThreshold: 24, unit: 'pts' }),
    power: Object.freeze({ label: 'Power', current: 72, max: 100, dailyUsage: 28, production: 31, warningThreshold: 25, unit: 'pts' }),
  }),
  shortageHealthLoss: Object.freeze({ oxygen: 16, water: 10, food: 10 }),
  lowReserveHealthLoss: Object.freeze({ oxygen: 5, water: 3, food: 3 }),
  scoreWeights: Object.freeze({ crew: 40, resources: 20, equipment: 20, responses: 10, continuity: 10 }),
});

export const CREW_TEMPLATE = Object.freeze([
  Object.freeze({ id: 'commander', name: 'Maya Chen', role: 'Mission Commander', initials: 'MC', color: 'violet', health: 100 }),
  Object.freeze({ id: 'engineer', name: 'Elias Okafor', role: 'Flight Engineer', initials: 'EO', color: 'teal', health: 96 }),
  Object.freeze({ id: 'scientist', name: 'Sofia Alvarez', role: 'Science Specialist', initials: 'SA', color: 'coral', health: 98 }),
  Object.freeze({ id: 'systems', name: 'Noah Williams', role: 'Systems Officer', initials: 'NW', color: 'blue', health: 97 }),
]);

export const EQUIPMENT_TEMPLATE = Object.freeze([
  Object.freeze({ id: 'oxygen-recycler', name: 'Oxygen recycler', condition: 94 }),
  Object.freeze({ id: 'water-recycler', name: 'Water recycler', condition: 91 }),
  Object.freeze({ id: 'solar-array', name: 'Solar array', condition: 96 }),
  Object.freeze({ id: 'habitat-systems', name: 'Habitat systems', condition: 95 }),
  Object.freeze({ id: 'backup-generator', name: 'Backup generator', condition: 88 }),
]);
