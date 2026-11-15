import { Activity, Boxes, ChevronDown, Command, FileClock, Gamepad2, LayoutDashboard, Radio, Settings, Shield, Users } from 'lucide-react';

const items = [
  { label: 'Overview', icon: LayoutDashboard }, { label: 'Survival sim', icon: Gamepad2 }, { label: 'Life support', icon: Activity },
  { label: 'Crew', icon: Users }, { label: 'Systems', icon: Boxes }, { label: 'Mission log', icon: FileClock },
];

export function Sidebar({ activeItem, onNavigate }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#overview" onClick={() => onNavigate('Overview')} aria-label="LUNAR OPS overview">
        <div className="brand-mark"><Command size={19} strokeWidth={1.8} /></div>
        <span><strong>LUNAR<span>OPS</span></strong><small>MISSION CONTROL</small></span>
      </a>
      <button className="mission-switcher" type="button"><span className="mission-switcher-icon"><Radio size={16} /></span><span className="mission-switcher-copy"><small>ACTIVE MISSION</small><strong>Artemis Ridge</strong></span><ChevronDown size={15} className="muted-icon" /></button>
      <div className="nav-label">OPERATIONS</div>
      <nav className="side-nav" aria-label="Main navigation">{items.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activeItem === label ? 'active' : ''}`} type="button" onClick={() => onNavigate(label)}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{label === 'Life support' && <span className="nav-alert-dot" />}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="comms-card"><div className="comms-icon"><Shield size={16} /></div><div><span>COMMS LINK</span><strong><i /> Secure connection</strong></div></div>
        <button className="profile-button" type="button"><span className="profile-avatar">JD</span><span className="profile-copy"><strong>Mission Director</strong><small>Ground control</small></span><Settings size={16} /></button>
      </div>
    </aside>
  );
}
