export const NAV_ITEMS = Object.freeze([
  Object.freeze({ label: 'Overview', view: 'overview' }),
  Object.freeze({ label: 'Survival sim', view: 'simulation' }),
  Object.freeze({ label: 'NASA Intelligence', view: 'nasa' }),
  Object.freeze({ label: 'Life support', view: 'life-support' }),
  Object.freeze({ label: 'Crew', view: 'crew' }),
  Object.freeze({ label: 'Systems', view: 'systems' }),
  Object.freeze({ label: 'Mission log', view: 'mission-log' }),
]);

const KNOWN_PANELS = new Set(['mission', 'notifications']);

export function createShellState() {
  return { activeNav: 'Overview', openPanel: null };
}

export function shellReducer(state, action) {
  switch (action.type) {
    case 'navigate':
      return NAV_ITEMS.some(({ label }) => label === action.destination)
        ? { activeNav: action.destination, openPanel: null }
        : state;
    case 'toggle-panel':
      if (!KNOWN_PANELS.has(action.panel)) return state;
      return { ...state, openPanel: state.openPanel === action.panel ? null : action.panel };
    case 'close-panel':
      return state.openPanel === null ? state : { ...state, openPanel: null };
    default:
      return state;
  }
}

export function resolveNavigationView(destination) {
  return NAV_ITEMS.find(({ label }) => label === destination)?.view ?? null;
}
