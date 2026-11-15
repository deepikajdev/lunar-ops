import { Activity, Boxes, Users } from 'lucide-react';
import { ActivityFeed } from './ActivityFeed.jsx';
import { CrewPanel } from './CrewPanel.jsx';
import { EmergencyPanel } from './EmergencyPanel.jsx';
import { OutpostVisual } from './OutpostVisual.jsx';
import { ResourceCard } from './ResourceCard.jsx';

const viewCopy = {
  'Life support': { title: 'Life support', kicker: 'HABITAT RESERVES', description: 'Current illustrative resource snapshot for oxygen, water, power, and food.' },
  Crew: { title: 'Crew roster', kicker: 'CREW STATUS', description: 'Crew assignments and location status from the simulated mission overview.' },
  Systems: { title: 'Outpost systems', kicker: 'SYSTEMS STATUS · DEMO', description: 'Conceptual outpost illustration and current simulated mission alerts.' },
  'Mission log': { title: 'Mission activity log', kicker: 'RECENT ACTIVITY · DEMO', description: 'The existing mission activity feed. Entries are static illustrative dashboard data.' },
};

function PageHeader({ title, kicker, description, icon: Icon }) {
  return <header className="operations-page-header panel"><span className="operations-page-icon"><Icon size={18} aria-hidden="true" /></span><div><p className="section-kicker">{kicker}</p><h1>{title}</h1><p>{description}</p></div></header>;
}

export function OperationsView({ destination, alerts, activity, crew, resources }) {
  const content = viewCopy[destination];
  if (!content) return null;
  const icon = destination === 'Life support' ? Activity : destination === 'Crew' ? Users : Boxes;
  return <div className="operations-view">
    <PageHeader {...content} icon={icon} />
    {destination === 'Life support' && <><section className="resource-section operations-resource-section" aria-labelledby="life-support-resources"><div className="section-heading"><div><p className="section-kicker">SIMULATED TELEMETRY</p><h2 id="life-support-resources">Resource reserves</h2></div><span className="simulated-label"><span /> DEMO SNAPSHOT</span></div><div className="resource-grid">{resources.map((resource, index) => <ResourceCard key={resource.name} resource={resource} index={index} />)}</div></section><EmergencyPanel alerts={alerts} /></>}
    {destination === 'Crew' && <CrewPanel crew={crew} />}
    {destination === 'Systems' && <div className="operations-systems-grid"><figure className="operations-outpost panel"><figcaption>CONCEPTUAL OUTPOST VISUAL · SIMULATED</figcaption><OutpostVisual /></figure><EmergencyPanel alerts={alerts} /></div>}
    {destination === 'Mission log' && <><ActivityFeed activity={activity} /><p className="operations-demo-note">This panel reuses the Phase 1 sample activity feed. It is not connected to the survival simulator history or live NASA observations.</p></>}
    <footer className="page-footer"><span>LUNAR OPS <b>·</b> EDUCATIONAL SIMULATOR</span><span>DEMO VALUES · NOT LIVE TELEMETRY</span></footer>
  </div>;
}
