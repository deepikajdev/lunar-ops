import { ArrowUpRight, Check, Circle, Radio } from 'lucide-react';

const activityIcons = { amber: Circle, cyan: Radio, green: Check };

export function ActivityFeed({ activity }) {
  return (
    <section className="panel activity-panel" aria-labelledby="activity-heading">
      <div className="panel-heading"><div><p className="section-kicker">FLIGHT DECK</p><h2 id="activity-heading">Recent activity</h2></div><button className="icon-link" type="button" aria-label="View activity log"><ArrowUpRight size={16} /></button></div>
      <div className="activity-list">{activity.map((item, index) => { const Icon = activityIcons[item.tone]; return <article className="activity-row" key={item.time}><div className={`activity-marker ${item.tone}`}><Icon size={13} /></div><div className="activity-copy"><strong>{item.title}</strong><small>{item.detail}</small></div><time>{item.time}</time>{index < activity.length - 1 && <span className="activity-line" />}</article>; })}</div>
    </section>
  );
}
