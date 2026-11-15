import { ResourceCard } from '../ResourceCard.jsx';

const meta = {
  oxygen: { icon: 'oxygen', tone: 'cyan' },
  water: { icon: 'water', tone: 'blue' },
  food: { icon: 'food', tone: 'green' },
  power: { icon: 'power', tone: 'amber' },
};

export function SimulationResourceGrid({ resources }) {
  return <div className="resource-grid sim-resource-grid">{Object.entries(resources).map(([id, resource], index) => {
    const percent = Math.round((resource.current / resource.max) * 100);
    return <ResourceCard key={id} index={index} resource={{
      ...meta[id], name: resource.label, value: percent, unit: '%',
      detail: `${resource.current.toFixed(0)} / ${resource.max} pts  ·  use ${resource.dailyUsage}/day  ·  base regen +${resource.production}`,
      trend: resource.current <= resource.warningThreshold ? 'Low reserve' : 'Simulated balance',
    }} />;
  })}</div>;
}
