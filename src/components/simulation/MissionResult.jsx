import { motion } from 'framer-motion';
import { Award, RotateCcw, ShieldAlert, ShieldCheck, Skull } from 'lucide-react';

const factorRows = [
  { id: 'crew', label: 'Crew survival', detail: (factor) => `${factor.living} / ${factor.total} alive · ${factor.averageHealth}% average health` },
  { id: 'resources', label: 'Resource reserves', detail: (factor) => `${factor.averageReserve}% average remaining capacity` },
  { id: 'equipment', label: 'Equipment condition', detail: (factor) => `${factor.averageCondition}% average · ${factor.minimumCondition}% lowest system` },
  { id: 'responses', label: 'Emergency response', detail: (factor) => `${factor.addressed} / ${factor.events} scenario events mitigated` },
  { id: 'continuity', label: 'Mission continuity', detail: (factor) => `${factor.value}% continuity retained` },
];

const outcomeMeta = {
  success: { title: 'Mission objectives achieved', icon: ShieldCheck, eyebrow: 'SUCCESSFUL SURVIVAL' },
  partial: { title: 'Mission completed with compromises', icon: ShieldAlert, eyebrow: 'PARTIAL SUCCESS' },
  failed: { title: 'Mission ended early', icon: Skull, eyebrow: 'SURVIVAL FAILURE' },
};

export function MissionResult({ state, dispatch }) {
  const result = state.score;
  const meta = outcomeMeta[result.outcome] ?? outcomeMeta.partial;
  const Icon = meta.icon;

  return (
    <motion.section className={`panel mission-result outcome-${result.outcome}`} aria-labelledby="mission-result-title" aria-live="polite" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
      <div className="result-intro"><span className="result-icon"><Icon size={22} /></span><div><p className="section-kicker">{meta.eyebrow} <span>·</span> DAY {state.day} / {state.maxDays}</p><h2 id="mission-result-title">{meta.title}</h2><p>{result.summary}</p></div><div className="result-score-ring" role="img" aria-label={`Mission score ${result.total} out of 100`} style={{ '--result-angle': `${result.total * 3.6}deg` }}><div><strong>{result.total}</strong><small>POINTS</small></div></div></div>
      <div className="result-divider" />
      <div className="result-breakdown"><div className="result-breakdown-heading"><div><p className="section-kicker">AFTER-ACTION REVIEW</p><h3>Score breakdown</h3></div><span><Award size={14} /> SIMULATED SCORING</span></div>
        {factorRows.map(({ id, label, detail }) => {
          const factor = result.factors[id];
          const percent = factor.possible ? Math.round((factor.score / factor.possible) * 100) : 0;
          return <div className="result-factor" key={id}><div className="result-factor-copy"><div><strong>{label}</strong><small>{detail(factor)}</small></div><span>{factor.score}<i> / {factor.possible}</i></span></div><div className="result-factor-track"><i style={{ width: `${percent}%` }} /></div></div>;
        })}
      </div>
      <div className="result-footer"><p>All scores use the illustrative game rules documented in this project. They are not a NASA evaluation.</p><button type="button" onClick={() => dispatch({ type: 'restart' })}><RotateCcw size={14} /> Restart scenario</button></div>
    </motion.section>
  );
}
