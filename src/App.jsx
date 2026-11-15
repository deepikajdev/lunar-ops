import { lazy, Suspense, useReducer, useState } from 'react';
import { motion } from 'framer-motion';
import { ActivityFeed } from './components/ActivityFeed.jsx';
import { CrewPanel } from './components/CrewPanel.jsx';
import { EmergencyPanel } from './components/EmergencyPanel.jsx';
import { MissionOverview } from './components/MissionOverview.jsx';
import { OutpostVisual } from './components/OutpostVisual.jsx';
import { ResourceCard } from './components/ResourceCard.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { SimulationView } from './components/simulation/SimulationView.jsx';
const SpaceWeatherView = lazy(() => import('./components/nasa/SpaceWeatherView.jsx').then((module) => ({ default: module.SpaceWeatherView })));
import { activity, alerts, crew, mission, resources } from './data/simulatedMission.js';
import { createInitialGameState } from './logic/gameState.js';
import { simulationReducer } from './logic/engine.js';

const appear = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } };

function App() {
  const [activeNav, setActiveNav] = useState('Overview');
  const [simulation, dispatch] = useReducer(simulationReducer, undefined, createInitialGameState);
  return (
    <div className="app-shell">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />
      <main className="main-content">
        {activeNav === 'Survival sim' ? <SimulationView state={simulation} dispatch={dispatch} /> : activeNav === 'NASA Intelligence' ? <Suspense fallback={<div className="nasa-loading" role="status">Loading NASA intelligence view…</div>}><SpaceWeatherView onSendSignal={(signal) => { dispatch({ type: 'receive-game-signal', signal }); setActiveNav('Survival sim'); }} /></Suspense> : <>
        <MissionOverview mission={mission} />
        <motion.section className="mission-hero panel" aria-label="Lunar outpost mission overview" variants={appear} initial="hidden" animate="visible">
          <div className="hero-copy">
            <div className="hero-label"><span className="live-dot" /> OUTPOST STATUS <span className="hero-divider">/</span> NOMINAL</div>
            <h2>Home, beyond<br />the horizon.</h2>
            <p className="hero-description">A simulated surface operations overview for the Artemis research outpost.</p>
            <div className="hero-meta">
              <div><span>LOCATION</span><strong>SHACKLETON RIDGE <i>·</i> SOUTH POLE</strong></div>
              <div><span>LOCAL TIME</span><strong>14:32 <i>·</i> LUNAR STANDARD</strong></div>
            </div>
          </div>
          <OutpostVisual />
          <span className="visual-caption">CONCEPTUAL OUTPOST VISUAL · SIMULATED</span>
        </motion.section>

        <section className="resource-section" aria-labelledby="resources-heading">
          <div className="section-heading"><div><p className="section-kicker">LIFE SUPPORT</p><h2 id="resources-heading">Resource reserves</h2></div><span className="simulated-label"><span /> SIMULATED TELEMETRY</span></div>
          <div className="resource-grid">{resources.map((resource, index) => <ResourceCard key={resource.name} resource={resource} index={index} />)}</div>
        </section>

        <section className="lower-grid" aria-label="Crew and mission updates">
          <CrewPanel crew={crew} />
          <div className="right-stack"><EmergencyPanel alerts={alerts} /><ActivityFeed activity={activity} /></div>
        </section>
        <footer className="page-footer"><span>LUNAR OPS <b>·</b> EDUCATIONAL SIMULATOR</span><span>ALL VALUES SHOWN ARE SIMULATED DEMO DATA</span></footer>
        </>}
      </main>
    </div>
  );
}

export default App;
