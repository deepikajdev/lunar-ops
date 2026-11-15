import { GAME_CONFIG } from './gameConfig.js';
import { getEventForDay } from './events.js';
import { getDecisionById } from './decisions.js';
import { createInitialGameState } from './gameState.js';
import { calculateMissionScore } from './scoring.js';
import { receiveGameSignal } from './gameSignals.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function getEquipmentCondition(state, id) {
  return state.equipment.find((item) => item.id === id)?.condition ?? 100;
}

function adjustCrewHealth(state, delta) {
  if (delta === 0) return;
  state.crew = state.crew.map((person) => {
    if (!person.alive) return person;
    const health = clamp(person.health + delta, 0, 100);
    return { ...person, health, alive: health > 0, safety: health === 0 ? 'deceased' : health <= GAME_CONFIG.warningHealth ? 'critical' : 'nominal' };
  });
}

function combineMapValues(...maps) {
  const combined = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map ?? {})) combined[key] = (combined[key] ?? 0) + value;
  }
  return combined;
}

export function canSelectDecision(state, decisionId) {
  const decision = getDecisionById(decisionId);
  if (!decision || state.status !== 'active') return false;
  return Object.entries(decision.resourceCosts).every(([id, cost]) => state.resources[id]?.current >= cost);
}

export function selectDecision(state, decisionId) {
  if (!canSelectDecision(state, decisionId)) return state;
  return { ...state, selectedDecisionId: decisionId };
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

  const decision = getDecisionById(state.selectedDecisionId);
  if (!decision || !canSelectDecision(state, decision.id)) return state;

  const next = cloneState(state);
  const before = Object.fromEntries(Object.entries(next.resources).map(([id, resource]) => [id, resource.current]));
  const event = next.activeEvent;
  const eventResponse = event?.responses?.[decision.id] ?? null;
  const mitigation = eventResponse?.mitigation ?? {};

  for (const [id, cost] of Object.entries(decision.resourceCosts)) {
    next.resources[id].current = clamp(next.resources[id].current - cost, 0, next.resources[id].max);
  }

  const equipmentDeltas = combineMapValues(decision.equipmentDeltas, event?.effects.equipmentDeltas, mitigation.equipmentDeltas);
  for (const [id, delta] of Object.entries(equipmentDeltas)) {
    const equipment = next.equipment.find((item) => item.id === id);
    if (equipment) equipment.condition = clamp(round1(equipment.condition + delta), 0, 100);
  }

  const conditionScaledDecisionDeltas = { ...decision.resourceDeltas };
  for (const [resourceId, equipmentId] of Object.entries(decision.resourceDeltaConditionFactors ?? {})) {
    if (conditionScaledDecisionDeltas[resourceId] !== undefined) {
      conditionScaledDecisionDeltas[resourceId] *= getEquipmentCondition(next, equipmentId) / 100;
    }
  }
  const resourceDeltas = combineMapValues(conditionScaledDecisionDeltas, event?.effects.resourceDeltas, mitigation.resourceDeltas);
  for (const [id, delta] of Object.entries(resourceDeltas)) {
    if (next.resources[id]) next.resources[id].current = clamp(next.resources[id].current + delta, 0, next.resources[id].max);
  }

  adjustCrewHealth(next, decision.crewHealthDelta + (event?.effects.crewHealthDelta ?? 0) + (mitigation.crewHealthDelta ?? 0));
  next.continuity = clamp(next.continuity + decision.continuityDelta + (event?.effects.continuityDelta ?? 0) + (mitigation.continuityDelta ?? 0), 0, 100);
  if (eventResponse) next.emergencyResponses += 1;

  let blackout = false;
  for (const [id, resource] of Object.entries(next.resources)) {
    const equipmentId = { oxygen: 'oxygen-recycler', water: 'water-recycler', power: 'solar-array' }[id];
    const conditionFactor = equipmentId ? getEquipmentCondition(next, equipmentId) / 100 : 1;
    const produced = Math.max(0, resource.production + (decision.productionDeltas[id] ?? 0) + (event?.effects.productionDeltas?.[id] ?? 0) + (mitigation.productionDeltas?.[id] ?? 0)) * conditionFactor;
    const available = resource.current + produced;
    const demand = Math.max(0, resource.dailyUsage + (decision.dailyUsageDeltas[id] ?? 0));
    resource.current = clamp(round1(available - demand), 0, resource.max);
    if (id === 'power' && available < demand) blackout = true;
  }

  if (blackout) {
    adjustCrewHealth(next, -6);
    next.continuity = clamp(next.continuity - 8, 0, 100);
    const habitat = next.equipment.find((item) => item.id === 'habitat-systems');
    if (habitat) habitat.condition = clamp(habitat.condition - 10, 0, 100);
  }

  for (const id of ['oxygen', 'water', 'food']) {
    const reserve = next.resources[id];
    const loss = reserve.current === 0
      ? GAME_CONFIG.shortageHealthLoss[id]
      : reserve.current < reserve.warningThreshold ? GAME_CONFIG.lowReserveHealthLoss[id] : 0;
    adjustCrewHealth(next, -loss);
  }

  for (const item of next.equipment) {
    item.condition = clamp(round1(item.condition - GAME_CONFIG.baselineEquipmentWear), 0, 100);
  }

  next.history.push({
    day: next.day,
    decisionId: decision.id,
    eventId: event?.id ?? null,
    eventResponse: eventResponse?.label ?? null,
    resourceChanges: Object.fromEntries(Object.entries(next.resources).map(([id, resource]) => [id, resource.current - before[id]])),
    summary: blackout
      ? `Day ${next.day} completed with a power blackout. Crew safety and outpost continuity were affected.`
      : event ? `Day ${next.day}: ${event.name}${eventResponse ? ` was addressed: ${eventResponse.label.toLowerCase()}` : ' was not directly addressed'}.` : `Day ${next.day} completed. Resources were consumed and regeneration systems operated.`,
  });

  if (next.day < next.maxDays) {
    const previousEventId = next.activeEvent?.id ?? null;
    next.day += 1;
    next.selectedDecisionId = 'balanced_ops';
    next.activeEvent = getEventForDay(next.seed, next.day, previousEventId);
    if (next.activeEvent) next.eventCount += 1;
  }

  if (next.crew.every((person) => !person.alive || person.health <= 0) || next.history.at(-1)?.day === next.maxDays) {
    next.score = calculateMissionScore(next);
    next.status = next.score.outcome;
  }

  return next;
}

export function restartGame(seed = GAME_CONFIG.defaultSeed) {
  return createInitialGameState(seed);
}

export function simulationReducer(state, action) {
  switch (action.type) {
    case 'select-decision':
      return selectDecision(state, action.decisionId);
    case 'advance-day':
      return advanceDay(state);
    case 'restart':
      return restartGame(action.seed ?? state.seed);
    case 'receive-game-signal':
      return receiveGameSignal(state, action.signal);
    default:
      return state;
  }
}
