import { GAME_CONFIG } from './gameConfig.js';

const rounded = (value) => Math.round(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function calculateMissionScore(state) {
  const crewTotal = Math.max(1, state.crew.length);
  const livingCrew = state.crew.filter((person) => person.alive && person.health > 0).length;
  const averageCrewHealth = state.crew.reduce((total, person) => total + person.health, 0) / crewTotal;
  const crewScore = rounded((livingCrew / crewTotal) * 30 + (averageCrewHealth / 100) * 10);

  const resourceValues = Object.values(state.resources);
  const averageReserve = resourceValues.length
    ? resourceValues.reduce((total, resource) => total + resource.current / Math.max(1, resource.max), 0) / resourceValues.length
    : 0;
  const resourcesScore = rounded(averageReserve * GAME_CONFIG.scoreWeights.resources);

  const equipmentValues = state.equipment.map((item) => item.condition);
  const averageCondition = equipmentValues.length
    ? equipmentValues.reduce((total, condition) => total + condition, 0) / equipmentValues.length
    : 0;
  const equipmentScore = rounded((averageCondition / 100) * GAME_CONFIG.scoreWeights.equipment);

  const responsesScore = state.eventCount === 0
    ? GAME_CONFIG.scoreWeights.responses
    : rounded((state.emergencyResponses / state.eventCount) * GAME_CONFIG.scoreWeights.responses);
  const continuityScore = rounded((clamp(state.continuity, 0, 100) / 100) * GAME_CONFIG.scoreWeights.continuity);
  const total = clamp(crewScore + resourcesScore + equipmentScore + responsesScore + continuityScore, 0, 100);
  const minimumEquipment = equipmentValues.length ? Math.min(...equipmentValues) : 0;
  const criticalReserveEmpty = ['oxygen', 'water', 'food'].some((id) => state.resources[id]?.current <= 0);

  let outcome;
  if (livingCrew === 0) outcome = 'failed';
  else if (state.day >= state.maxDays && livingCrew === crewTotal && total >= 70 && minimumEquipment >= GAME_CONFIG.criticalEquipment && !criticalReserveEmpty) outcome = 'success';
  else if (state.day >= state.maxDays) outcome = 'partial';
  else outcome = 'active';

  const summary = {
    success: 'The crew completed the 10-day survival mission with operational systems.',
    partial: 'The outpost reached the final day, but one or more mission objectives were compromised.',
    failed: 'The crew could not be kept alive. The mission ended early.',
    active: 'Mission scoring is available at the end of the 10-day operation.',
  }[outcome];

  return {
    total,
    outcome,
    summary,
    factors: {
      crew: { score: crewScore, possible: GAME_CONFIG.scoreWeights.crew, living: livingCrew, total: crewTotal, averageHealth: rounded(averageCrewHealth) },
      resources: { score: resourcesScore, possible: GAME_CONFIG.scoreWeights.resources, averageReserve: rounded(averageReserve * 100) },
      equipment: { score: equipmentScore, possible: GAME_CONFIG.scoreWeights.equipment, averageCondition: rounded(averageCondition), minimumCondition: rounded(minimumEquipment) },
      responses: { score: responsesScore, possible: GAME_CONFIG.scoreWeights.responses, addressed: state.emergencyResponses, events: state.eventCount },
      continuity: { score: continuityScore, possible: GAME_CONFIG.scoreWeights.continuity, value: rounded(state.continuity) },
    },
  };
}
