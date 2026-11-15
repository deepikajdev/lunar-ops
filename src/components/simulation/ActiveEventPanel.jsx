import { AlertTriangle, CheckCircle2, Radio, ShieldAlert } from 'lucide-react';
import { DECISION_CATALOG } from '../../logic/decisions.js';

export function ActiveEventPanel({ event, selectedDecisionId }) {
  if (!event) {
    return <section className="panel sim-event-panel no-event" aria-labelledby="sim-event-title"><div className="sim-panel-heading"><div><p className="section-kicker">EVENT MONITOR</p><h2 id="sim-event-title">No active event</h2></div><span className="event-monitor-icon"><Radio size={16} /></span></div><div className="sim-no-event-state"><CheckCircle2 size={22} /><span>Systems remain on watch</span><small>Events are selected deterministically from the scenario seed.</small></div><p className="sim-event-disclaimer">Scenario alerts are fictional game events, not live telemetry or forecasts.</p></section>;
  }

  return (
    <section className={`panel sim-event-panel event-${event.severity}`} aria-labelledby="sim-event-title">
      <div className="sim-panel-heading"><div><p className="section-kicker">ACTIVE SCENARIO EVENT</p><h2 id="sim-event-title">Mission alert</h2></div><span className={`event-severity ${event.severity}`}><ShieldAlert size={12} /> {event.severity}</span></div>
      <div className="sim-event-card"><span className="sim-event-icon"><AlertTriangle size={19} /></span><div><h3>{event.name}</h3><p>{event.description}</p></div></div>
      <div className="sim-response-list"><p>AVAILABLE RESPONSES</p>{Object.entries(event.responses).map(([decisionId, response]) => {
        const decision = DECISION_CATALOG.find((item) => item.id === decisionId);
        return <div key={decisionId} className={`sim-response-option ${selectedDecisionId === decisionId ? 'chosen' : ''}`}><span>{response.label}</span><small>{decision?.name}</small>{selectedDecisionId === decisionId && <i>SELECTED</i>}</div>;
      })}</div>
      <p className="sim-event-disclaimer">This alert is a deterministic scenario event, not an operational warning or forecast.</p>
    </section>
  );
}
