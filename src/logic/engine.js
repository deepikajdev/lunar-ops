function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

  for (const resource of Object.values(next.resources)) {
    // Supply arrives during the day, then crew and equipment draw from the reserve.
    resource.current = clamp(resource.current + resource.production - resource.dailyUsage, 0, resource.max);
  }

  next.history.push({
    day: next.day,
    decisionId: next.selectedDecisionId,
    eventId: next.activeEvent?.id ?? null,
    resourceChanges: Object.fromEntries(Object.entries(next.resources).map(([id, resource]) => [id, resource.current - before[id]])),
    summary: `Day ${next.day} completed. Daily supplies and production were applied.`,
  });

  if (next.day < next.maxDays) {
    next.day += 1;
    next.selectedDecisionId = 'balanced_ops';
    next.activeEvent = null;
  }

  return next;
}
