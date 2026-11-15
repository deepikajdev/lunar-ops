import { Activity, BatteryCharging, CalendarDays, RadioTower, ShieldCheck } from 'lucide-react';
import { GAME_CONFIG } from '../../logic/gameConfig.js';
import { ActiveEventPanel } from './ActiveEventPanel.jsx';
import { CrewHealthPanel } from './CrewHealthPanel.jsx';
import { DecisionPanel } from './DecisionPanel.jsx';
import { EquipmentStatusPanel } from './EquipmentStatusPanel.jsx';
import { MissionLogPanel } from './MissionLogPanel.jsx';
import { MissionResult } from './MissionResult.jsx';
import { SimulationResourceGrid } from './SimulationResourceGrid.jsx';
import '../../styles/simulation.css';

export function SimulationView({ state, dispatch }) {
  const progress = Math.round(((state.day - 1) / (state.maxDays - 1)) * 100);
  const warnings = Object.entries(state.resources).filter(([, resource]) => resource.current <= resource.warningThreshold).length;

  return (
    <div className="simulation-view">
      <header className="sim-topbar">
        <div><div className="sim-breadcrumb"><span>MISSION SYSTEMS</span><span>/</span><strong>SURVIVAL SIMULATOR</strong></div><p className="sim-mode">10-DAY OUTPOST SURVIVAL SCENARIO</p></div>
        <div className="sim-live-pill"><span /> SIMULATION MODE</div>
      </header>

      <section className="sim-mission-banner panel" aria-labelledby="sim-title">
        <div className="sim-title-block"><p className="section-kicker">LUNAR OPERATIONS <span>·</span> LO-02</p><h1 id="sim-title">Survival operations</h1><p>Keep the crew safe. Keep the outpost running.</p></div>
        <div className="sim-day-display"><div className="sim-day-icon"><CalendarDays size={18} /></div><div><span>MISSION DAY</span><strong>{String(state.day).padStart(2, '0')} <i>/ {state.maxDays}</i></strong></div></div>
        <div className="sim-progress-wrap"><div className="sim-progress-label"><span>MISSION PROGRESS</span><b>{progress}%</b></div><div className="sim-progress-track" role="progressbar" aria-label="Mission progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div><div className="sim-progress-days">{Array.from({ length: GAME_CONFIG.maxDays }, (_, index) => <i key={index} className={index < state.day ? 'passed' : ''} />)}</div></div>
      </section>

      <section className="sim-status-strip" aria-label="Outpost status summary">
        <div><span className="status-strip-icon green"><ShieldCheck size={15} /></span><span><small>CREW STATUS</small><strong>{state.crew.filter((person) => person.alive).length} / {state.crew.length} ALIVE</strong></span></div>
        <div><span className="status-strip-icon cyan"><BatteryCharging size={15} /></span><span><small>POWER BUS</small><strong>{state.resources.power.current <= state.resources.power.warningThreshold ? 'LOW RESERVE' : 'ONLINE'}</strong></span></div>
        <div><span className="status-strip-icon amber"><Activity size={15} /></span><span><small>RESOURCE WATCH</small><strong>{warnings ? `${warnings} WARNING${warnings > 1 ? 'S' : ''}` : 'NOMINAL'}</strong></span></div>
        <div><span className="status-strip-icon blue"><RadioTower size={15} /></span><span><small>MISSION LINK</small><strong>{state.continuity}% CONTINUITY</strong></span></div>
      </section>

      <section className="sim-resource-section" aria-labelledby="sim-resource-heading">
        <div className="sim-section-heading"><div><p className="section-kicker">LIFE SUPPORT & UTILITIES</p><h2 id="sim-resource-heading">Outpost reserves</h2></div><span className="sim-data-tag"><i /> ILLUSTRATIVE GAME VALUES</span></div>
        <SimulationResourceGrid resources={state.resources} />
      </section>

      {state.status === 'active' ? <div className="sim-action-grid"><DecisionPanel state={state} dispatch={dispatch} /><ActiveEventPanel event={state.activeEvent} selectedDecisionId={state.selectedDecisionId} /></div> : <MissionResult state={state} dispatch={dispatch} />}

      <section className="sim-monitor-grid" aria-label="Crew, equipment, and daily mission log">
        <div className="sim-monitor-left"><CrewHealthPanel crew={state.crew} /><EquipmentStatusPanel equipment={state.equipment} /></div>
        <MissionLogPanel history={state.history} />
      </section>

      <footer className="sim-disclaimer"><span>GAME MODEL ONLY <b>·</b> NOT OPERATIONAL LUNAR ESTIMATES</span><span>ENGINE BALANCE VALUES ARE ILLUSTRATIVE AND NOT NASA DATA</span></footer>
    </div>
  );
}
