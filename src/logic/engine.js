import { GAME_CONFIG } from './gameConfig.js';
import { getEventForDay } from './events.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function getEquipmentCondition(state, id) {
  return state.equipment.find((item) => item.id === id)?.condition ?? 100;
}

function damageCrew(state, amount) {
  if (amount <= 0) return;
  state.crew = state.crew.map((person) => {
    if (!person.alive) return person;
    const health = clamp(person.health - amount, 0, 100);
    return { ...person, health, alive: health > 0, safety: health === 0 ? 'deceased' : health <= GAME_CONFIG.warningHealth ? 'critical' : 'nominal' };
  });
}

function cloneState(state) {
  return {
    ...state,
    resources: Object.fromEntries(Object.entries(state.resources).map(([id, resource]) => [id, { ...resource }])),
    crew: state.crew.map((person) => ({ ...person })),
    equipment: state.equipment.map((item) => ({ ...item })),
    history: [...state.history],
  };
}

export function advanceDay(state) {
  if (state.status !== 'active' || state.day > state.maxDays) return state;
  if (state.history.at(-1)?.day === state.day) return state;

  const next = cloneState(state);
  const before = Object.fromEntries(Object.entries(next.resources).map(([id, resource]) => [id, resource.current]));

  let blackout = false;
  for (const [id, resource] of Object.entries(next.resources)) {
    const equipmentId = { oxygen: 'oxygen-recycler', water: 'water-recycler', power: 'solar-array' }[id];
    const conditionFactor = equipmentId ? getEquipmentCondition(next, equipmentId) / 100 : 1;
    const produced = resource.production * conditionFactor;
    const available = resource.current + produced;
    const demand = resource.dailyUsage;
    resource.current = clamp(round1(available - demand), 0, resource.max);
    if (id === 'power' && available < demand) blackout = true;
  }

  if (blackout) {
    damageCrew(next, 6);
    next.continuity = clamp(next.continuity - 8, 0, 100);
    const habitat = next.equipment.find((item) => item.id === 'habitat-systems');
    if (habitat) habitat.condition = clamp(habitat.condition - 10, 0, 100);
  }

  for (const id of ['oxygen', 'water', 'food']) {
    const reserve = next.resources[id];
    const loss = reserve.current === 0
      ? GAME_CONFIG.shortageHealthLoss[id]
      : reserve.current < reserve.warningThreshold ? GAME_CONFIG.lowReserveHealthLoss[id] : 0;
    damageCrew(next, loss);
  }

  for (const item of next.equipment) {
    item.condition = clamp(round1(item.condition - GAME_CONFIG.baselineEquipmentWear), 0, 100);
  }

  next.history.push({
    day: next.day,
    decisionId: next.selectedDecisionId,
    eventId: next.activeEvent?.id ?? null,
    resourceChanges: Object.fromEntries(Object.entries(next.resources).map(([id, resource]) => [id, resource.current - before[id]])),
    summary: blackout
      ? `Day ${next.day} completed with a power blackout. Crew safety and outpost continuity were affected.`
      : `Day ${next.day} completed. Resources were consumed and regeneration systems operated.`,
  });

  if (next.day < next.maxDays) {
    const previousEventId = next.activeEvent?.id ?? null;
    next.day += 1;
    next.selectedDecisionId = 'balanced_ops';
    next.activeEvent = getEventForDay(next.seed, next.day, previousEventId);
    if (next.activeEvent) next.eventCount += 1;
  }

  return next;
}
