import { ArrowRight, CheckCircle2, Shield, ShieldAlert } from 'lucide-react';
import { canSelectDecision } from '../../logic/engine.js';
import { DECISION_CATALOG } from '../../logic/decisions.js';

export function DecisionPanel({ state, dispatch }) {
  return (
    <section className="panel sim-decision-panel" aria-labelledby="decision-heading">
      <div className="sim-panel-heading sim-decision-heading"><div><p className="section-kicker">DAY {String(state.day).padStart(2, '0')} · COMMAND DECISION</p><h2 id="decision-heading">Choose today’s action</h2></div><span className="decision-choice-count"><Shield size={13} /> ONE ACTION PER DAY</span></div>
      <div className="sim-decision-grid" role="radiogroup" aria-labelledby="decision-heading">
        {DECISION_CATALOG.map((decision) => {
          const selected = state.selectedDecisionId === decision.id;
          const affordable = canSelectDecision(state, decision.id);
          const response = state.activeEvent?.responses[decision.id];
          return <button
            className={`sim-decision-card ${selected ? 'selected' : ''} ${!affordable ? 'unaffordable' : ''}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${decision.name}. ${decision.summary} Cost: ${decision.costs} Benefits: ${decision.benefits} Risk: ${decision.risks}`}
            key={decision.id}
            disabled={!affordable}
            onClick={() => dispatch({ type: 'select-decision', decisionId: decision.id })}
          >
            <span className="decision-card-top"><span className="decision-radio">{selected && <i />}</span>{response && <span className="decision-response-tag"><ShieldAlert size={10} /> EVENT RESPONSE</span>}{selected && !response && <span className="decision-selected-tag"><CheckCircle2 size={10} /> SELECTED</span>}</span>
            <strong className="decision-name">{decision.name}</strong>
            <span className="decision-summary">{decision.summary}</span>
            <span className="decision-tradeoff"><span><b>BENEFIT</b>{decision.benefits}</span><span><b>TRADEOFF</b>{decision.costs}</span></span>
            {response && <span className="decision-response-copy">Response: {response.label}</span>}
          </button>;
        })}
      </div>
      <div className="sim-advance-row"><span className="sim-risk-note"><ShieldAlert size={13} /> Daily resources, equipment wear, crew safety, and selected event effects resolve together.</span><button className="sim-advance-button" type="button" onClick={() => dispatch({ type: 'advance-day' })}>{state.day === state.maxDays ? 'Complete Day 10' : 'Advance day'}<ArrowRight size={15} /></button></div>
    </section>
  );
}
