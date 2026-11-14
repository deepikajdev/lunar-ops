import { AlertTriangle, Clock3, ShieldAlert } from 'lucide-react';

const alertIcons = { dust: AlertTriangle, clock: Clock3 };

export function EmergencyPanel({ alerts }) {
  return (
    <section className="panel emergency-panel" aria-labelledby="alerts-heading">
      <div className="panel-heading alert-heading"><div className="alert-title-wrap"><span className="alert-heading-icon"><ShieldAlert size={17} /></span><div><p className="section-kicker">MISSION SAFETY</p><h2 id="alerts-heading">Alerts <span className="alert-count">{alerts.length}</span></h2></div></div><span className="demo-status">DEMO</span></div>
      <div className="alert-list">{alerts.map((alert) => { const Icon = alertIcons[alert.icon]; return <article className={`alert-row ${alert.severity}`} key={alert.title}><span className="alert-icon"><Icon size={16} /></span><span className="alert-copy"><strong>{alert.title}</strong><small>{alert.detail}</small></span><span className="alert-chevron">›</span></article>; })}</div>
      <div className="all-clear"><span><i /> NO CRITICAL ALERTS</span><span>2 OPEN</span></div>
    </section>
  );
}
