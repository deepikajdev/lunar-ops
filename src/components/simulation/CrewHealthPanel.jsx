import { HeartPulse, Users } from 'lucide-react';

export function CrewHealthPanel({ crew }) {
  const aliveCount = crew.filter((person) => person.alive).length;
  return (
    <section className="panel sim-crew-panel" aria-labelledby="sim-crew-title">
      <div className="sim-panel-heading"><div><p className="section-kicker">CREW HEALTH & SAFETY</p><h2 id="sim-crew-title">Crew status</h2></div><span className="sim-panel-count"><Users size={13} /> {aliveCount}/{crew.length}</span></div>
      <div className="sim-crew-list">{crew.map((person) => (
        <article className={`sim-crew-row ${person.alive ? '' : 'deceased'}`} key={person.id}>
          <span className={`crew-avatar ${person.color}`}>{person.initials}</span>
          <span className="sim-crew-details"><strong>{person.name}</strong><small>{person.role}</small><span className="sim-health-track" role="meter" aria-label={`${person.name} health`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={person.health}><i style={{ width: `${person.health}%` }} /></span></span>
          <span className={`sim-health-value ${person.health <= 35 ? 'low' : ''}`}><HeartPulse size={13} />{person.health}<small>%</small></span>
        </article>
      ))}</div>
      <div className="sim-panel-footnote"><i className="health-pulse" /> STATUS DERIVED FROM SIMULATED GAME STATE</div>
    </section>
  );
}
