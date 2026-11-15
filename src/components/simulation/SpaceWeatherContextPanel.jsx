import { ArrowUpRight, Orbit } from 'lucide-react';

export function SpaceWeatherContextPanel({ signals = [] }) {
  if (!signals.length) return null;
  return <section className="sim-space-weather panel" aria-labelledby="space-weather-context-title">
    <div className="panel-heading"><div><p className="section-kicker">NASA ARCHIVE · INFORMATION ONLY</p><h2 id="space-weather-context-title">Space weather context <span className="sim-context-count">{signals.length}</span></h2></div><Orbit size={17} aria-hidden="true" /></div>
    <p className="sim-context-intro">These verified observations are educational context. They do not affect simulated survival calculations.</p>
    <div className="sim-context-list">{signals.map((signal) => <article key={signal.signalId}>
      <div><span>{signal.eventType} · {signal.classification}</span><strong>{signal.title}</strong><p>{signal.message}</p></div>
      <a href={signal.sourceUrl} target="_blank" rel="noreferrer">NASA record <ArrowUpRight size={12} /></a>
    </article>)}</div>
  </section>;
}
