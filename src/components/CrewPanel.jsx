import { ArrowUpRight, Radio } from 'lucide-react';

export function CrewPanel({ crew }) {
  return (
    <section className="panel crew-panel" aria-labelledby="crew-heading">
      <div className="panel-heading"><div><p className="section-kicker">CREW HEALTH & LOCATION</p><h2 id="crew-heading">Crew status <span className="crew-count">{String(crew.length).padStart(2, '0')}</span></h2></div><button className="text-button" type="button">ROSTER <ArrowUpRight size={14} /></button></div>
      <div className="crew-summary"><div className="crew-avatars">{crew.map((person) => <span key={person.initials} className={`crew-avatar ${person.color}`} title={person.name}>{person.initials}</span>)}</div><span><Radio size={13} /> All crew accounted for</span></div>
      <div className="crew-list">{crew.map((person) => <article className="crew-row" key={person.initials}><span className={`crew-avatar ${person.color}`}>{person.initials}</span><span className="crew-info"><strong>{person.name}</strong><small>{person.role}</small></span><span className={`crew-status ${person.status === 'On EVA' ? 'eva' : ''}`}><i />{person.status}</span></article>)}</div>
      <div className="crew-footnote"><span className="health-pulse" /> BIOMETRICS NOMINAL <span>·</span> UPDATED 14:29 LST</div>
    </section>
  );
}
