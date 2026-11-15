import { Cpu, Wrench } from 'lucide-react';

export function EquipmentStatusPanel({ equipment }) {
  return (
    <section className="panel sim-equipment-panel" aria-labelledby="sim-equipment-title">
      <div className="sim-panel-heading"><div><p className="section-kicker">OUTPOST SYSTEMS</p><h2 id="sim-equipment-title">Equipment condition</h2></div><Cpu size={16} className="sim-muted-icon" /></div>
      <div className="sim-equipment-list">{equipment.map((item) => {
        const condition = Math.round(item.condition);
        return <div className="sim-equipment-row" key={item.id}><div className="sim-equipment-meta"><span>{item.name}</span><strong className={condition <= 35 ? 'low' : ''}>{condition}%</strong></div><div className="sim-equipment-track" role="meter" aria-label={`${item.name} condition`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={condition}><i className={condition <= 35 ? 'low' : ''} style={{ width: `${condition}%` }} /></div></div>;
      })}</div>
      <div className="sim-panel-footnote"><Wrench size={12} /> ALL SYSTEMS LOSE CONDITION WITH DAILY USE</div>
    </section>
  );
}
