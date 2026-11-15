import { AlertTriangle, Bell, CalendarDays, ChevronRight, Clock3, Orbit } from 'lucide-react';

const alertIcons = { dust: AlertTriangle, clock: Clock3 };

export function MissionOverview({ mission, alerts, notificationsOpen, onToggleNotifications, onNavigate, onClosePanel }) {
  const progress = Math.round((mission.day / mission.totalDays) * 100);
  return (
    <header className="topbar" id="overview" onKeyDown={(event) => { if (event.key === 'Escape') onClosePanel?.(); }}>
      <div className="breadcrumb"><span>MISSIONS</span><ChevronRight size={14} /><strong>{mission.name}</strong><span className="mission-id">{mission.id}</span></div>
      <div className="topbar-actions"><div className="simulation-pill"><span /> SIMULATION MODE</div><div className="notification-wrap"><button className="icon-button notification-button" type="button" aria-label={`Notifications, ${alerts.length} demo alerts`} aria-haspopup="dialog" aria-expanded={notificationsOpen} aria-controls="notification-details" onClick={onToggleNotifications}><Bell size={17} /><i aria-hidden="true" /></button><section className="notification-popover" id="notification-details" role="dialog" aria-labelledby="notification-title" hidden={!notificationsOpen}><div className="notification-popover-heading"><div><p className="section-kicker">MISSION SAFETY · DEMO</p><h2 id="notification-title">Notifications</h2></div><span>{alerts.length} alerts</span></div><ul>{alerts.map((alert) => { const Icon = alertIcons[alert.icon] ?? AlertTriangle; return <li key={alert.title}><Icon size={15} aria-hidden="true" /><span><strong>{alert.title}</strong><small>{alert.detail}</small></span></li>; })}</ul><button className="notification-view-all" type="button" onClick={() => onNavigate('Systems')}>Review mission systems</button></section></div><div className="day-indicator"><div className="day-icon"><CalendarDays size={16} /></div><div><small>MISSION DAY</small><strong>{String(mission.day).padStart(2, '0')} <span>/ {mission.totalDays}</span></strong></div></div></div>
      <div className="mission-progress" aria-label={`Mission progress ${progress}%`}><div style={{ width: `${progress}%` }} /></div>
      <div className="overview-subbar"><span><Orbit size={13} /> {mission.phase.toUpperCase()}</span><span>MISSION ELAPSED <b>{progress}%</b></span></div>
    </header>
  );
}
