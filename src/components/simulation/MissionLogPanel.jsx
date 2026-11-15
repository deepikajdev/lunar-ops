import { BookOpenCheck, Check, Circle, Siren } from 'lucide-react';
import { DECISION_CATALOG } from '../../logic/decisions.js';

function getDecisionName(decisionId) {
  return DECISION_CATALOG.find((decision) => decision.id === decisionId)?.name ?? 'Unknown action';
}

export function MissionLogPanel({ history }) {
  const recent = [...history].slice(-6).reverse();
  return (
    <section className="panel sim-log-panel" aria-labelledby="sim-log-heading">
      <div className="sim-panel-heading"><div><p className="section-kicker">FLIGHT DECK RECORD</p><h2 id="sim-log-heading">Daily mission log</h2></div><BookOpenCheck size={16} className="sim-muted-icon" /></div>
      {recent.length === 0 ? <div className="sim-empty-log"><Circle size={16} /><span>Mission log is clear.</span><small>Each completed day records the selected action and scenario outcome here.</small></div> : <ol className="sim-log-list">{recent.map((entry) => <li className="sim-log-entry" key={entry.day}><span className={`sim-log-icon ${entry.eventId ? 'event' : ''}`}>{entry.eventId ? <Siren size={12} /> : <Check size={12} />}</span><div className="sim-log-copy"><div><strong>DAY {String(entry.day).padStart(2, '0')}</strong><small>{getDecisionName(entry.decisionId)}</small></div><p>{entry.summary}</p>{entry.eventResponse && <span className="sim-log-response">MITIGATION: {entry.eventResponse}</span>}</div></li>)}</ol>}
    </section>
  );
}
