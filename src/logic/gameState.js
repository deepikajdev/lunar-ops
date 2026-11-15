import { CREW_TEMPLATE, EQUIPMENT_TEMPLATE, GAME_CONFIG } from './gameConfig.js';

export function createInitialGameState(seed = GAME_CONFIG.defaultSeed) {
  const resources = Object.fromEntries(
    Object.entries(GAME_CONFIG.resources).map(([id, config]) => [id, { ...config }]),
  );

  return {
    day: 1,
    maxDays: GAME_CONFIG.maxDays,
    status: 'active',
    seed,
    resources,
    crew: CREW_TEMPLATE.map((person) => ({ ...person, alive: true })),
    equipment: EQUIPMENT_TEMPLATE.map((item) => ({ ...item })),
    selectedDecisionId: 'balanced_ops',
    activeEvent: null,
    history: [],
    emergencyResponses: 0,
    eventCount: 0,
    continuity: 100,
    score: null,
  };
}
