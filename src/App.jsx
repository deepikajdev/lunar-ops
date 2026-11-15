import { lazy, Suspense, useReducer } from 'react';
import { MotionConfig } from 'framer-motion';
import { OverviewView } from './components/OverviewView.jsx';
import { OperationsView } from './components/OperationsView.jsx';
import { MissionOverview } from './components/MissionOverview.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { SimulationView } from './components/simulation/SimulationView.jsx';
import { activity, alerts, crew, mission, resources } from './data/simulatedMission.js';
import { createInitialGameState } from './logic/gameState.js';
import { simulationReducer } from './logic/engine.js';
import { createShellState, resolveNavigationView, shellReducer } from './navigation.js';

const SpaceWeatherView = lazy(() => import('./components/nasa/SpaceWeatherView.jsx').then((module) => ({ default: module.SpaceWeatherView })));

function App() {
  const [shell, dispatchShell] = useReducer(shellReducer, undefined, createShellState);
  const [simulation, dispatchSimulation] = useReducer(simulationReducer, undefined, createInitialGameState);
  const { activeNav, openPanel } = shell;
  const navigate = (destination) => dispatchShell({ type: 'navigate', destination });
  const togglePanel = (panel) => dispatchShell({ type: 'toggle-panel', panel });
  const closePanel = () => dispatchShell({ type: 'close-panel' });
  const view = resolveNavigationView(activeNav);

  return <MotionConfig reducedMotion="user"><div className="app-shell">
    <Sidebar activeItem={activeNav} onNavigate={navigate} mission={mission} missionPanelOpen={openPanel === 'mission'} onToggleMission={() => togglePanel('mission')} onClosePanel={closePanel} />
    <main className="main-content">
      {view === 'simulation' && <SimulationView state={simulation} dispatch={dispatchSimulation} />}
      {view === 'nasa' && <Suspense fallback={<div className="nasa-loading" role="status">Loading NASA intelligence view…</div>}><SpaceWeatherView onSendSignal={(signal) => { dispatchSimulation({ type: 'receive-game-signal', signal }); navigate('Survival sim'); }} /></Suspense>}
      {view !== 'simulation' && view !== 'nasa' && <>
        <MissionOverview mission={mission} alerts={alerts} notificationsOpen={openPanel === 'notifications'} onToggleNotifications={() => togglePanel('notifications')} onNavigate={navigate} onClosePanel={closePanel} />
        {view === 'overview'
          ? <OverviewView alerts={alerts} activity={activity} crew={crew} resources={resources} onNavigate={navigate} />
          : <OperationsView destination={activeNav} alerts={alerts} activity={activity} crew={crew} resources={resources} />}
      </>}
    </main>
  </div></MotionConfig>;
}

export default App;
