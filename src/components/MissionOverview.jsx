import { Bell, CalendarDays, ChevronRight, Orbit } from 'lucide-react';

export function MissionOverview({ mission }) {
  const progress = Math.round((mission.day / mission.totalDays) * 100);
  return (
    <header className="topbar" id="overview">
      <div className="breadcrumb"><span>MISSIONS</span><ChevronRight size={14} /><strong>{mission.name}</strong><span className="mission-id">{mission.id}</span></div>
      <div className="topbar-actions"><div className="simulation-pill"><span /> SIMULATION MODE</div><button className="icon-button notification-button" type="button" aria-label="Notifications"><Bell size={17} /><i /></button><div className="day-indicator"><div className="day-icon"><CalendarDays size={16} /></div><div><small>MISSION DAY</small><strong>{String(mission.day).padStart(2, '0')} <span>/ {mission.totalDays}</span></strong></div></div></div>
      <div className="mission-progress" aria-label={`Mission progress ${progress}%`}><div style={{ width: `${progress}%` }} /></div>
      <div className="overview-subbar"><span><Orbit size={13} /> {mission.phase.toUpperCase()}</span><span>MISSION ELAPSED <b>{progress}%</b></span></div>
    </header>
  );
}
