import { Activity, Boxes, ChevronDown, Command, FileClock, Gamepad2, LayoutDashboard, Radio, Shield, Users, Orbit } from 'lucide-react';
import { NAV_ITEMS } from '../navigation.js';

const icons = { Overview: LayoutDashboard, 'Survival sim': Gamepad2, 'NASA Intelligence': Orbit, 'Life support': Activity, Crew: Users, Systems: Boxes, 'Mission log': FileClock };

export function Sidebar({ activeItem, onNavigate, mission, missionPanelOpen, onToggleMission, onClosePanel }) {
  return (
    <aside className="sidebar" onKeyDown={(event) => { if (event.key === 'Escape') onClosePanel?.(); }}>
      <a className="brand" href="#overview" onClick={() => onNavigate('Overview')} aria-label="LUNAR OPS overview">
        <div className="brand-mark"><Command size={19} strokeWidth={1.8} /></div>
        <span><strong>LUNAR<span>OPS</span></strong><small>MISSION CONTROL</small></span>
      </a>
      <div className="mission-switcher-wrap">
        <button className="mission-switcher" type="button" aria-label={`Active mission: ${mission.name}`} aria-haspopup="dialog" aria-expanded={missionPanelOpen} aria-controls="mission-details" onClick={onToggleMission}><span className="mission-switcher-icon"><Radio size={16} /></span><span className="mission-switcher-copy"><small>ACTIVE MISSION</small><strong>Artemis Ridge</strong></span><ChevronDown size={15} className="muted-icon" /></button>
        {missionPanelOpen && <section className="mission-popover" id="mission-details" role="dialog" aria-labelledby="mission-popover-title"><p className="section-kicker">CURRENT DEMO MISSION</p><h2 id="mission-popover-title">{mission.name}</h2><dl><div><dt>MISSION ID</dt><dd>{mission.id}</dd></div><div><dt>PHASE</dt><dd>{mission.phase}</dd></div><div><dt>CREW</dt><dd>{mission.crewCount} · SIMULATED</dd></div></dl><button type="button" onClick={() => onNavigate('Overview')}>Open mission overview</button></section>}
      </div>
      <div className="nav-label">OPERATIONS</div>
      <nav className="side-nav" aria-label="Main navigation">{NAV_ITEMS.map(({ label }) => { const Icon = icons[label]; return <button key={label} className={`nav-item ${activeItem === label ? 'active' : ''}`} type="button" aria-label={label} title={label} aria-current={activeItem === label ? 'page' : undefined} onClick={() => onNavigate(label)}><Icon size={17} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>{label === 'Life support' && <span className="nav-alert-dot" aria-hidden="true" />}</button>; })}</nav>
      <div className="sidebar-bottom">
        <div className="comms-card"><div className="comms-icon"><Shield size={16} /></div><div><span>COMMS LINK</span><strong><i /> Secure connection</strong></div></div>
        <div className="profile-card" role="group" aria-label="Mission Director, ground control, demo profile"><span className="profile-avatar" aria-hidden="true">JD</span><span className="profile-copy"><strong>Mission Director</strong><small>Ground control · demo profile</small></span></div>
      </div>
    </aside>
  );
}
