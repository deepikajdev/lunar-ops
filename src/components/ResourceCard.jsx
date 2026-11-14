import { motion } from 'framer-motion';
import { Droplets, Leaf, Zap, Wind } from 'lucide-react';

const resourceIcons = { oxygen: Wind, water: Droplets, power: Zap, food: Leaf };

export function ResourceCard({ resource, index = 0 }) {
  const Icon = resourceIcons[resource.icon];
  return (
    <motion.article className={`resource-card panel tone-${resource.tone}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.07 }}>
      <div className="resource-top"><span className="resource-icon"><Icon size={18} strokeWidth={1.8} /></span><span className="resource-state"><i /> {resource.trend}</span></div>
      <div className="resource-name">{resource.name}</div><div className="resource-value">{resource.value}<span>{resource.unit}</span></div>
      <div className="resource-meter" role="meter" aria-label={`${resource.name} reserve`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={resource.value}><span style={{ width: `${resource.value}%` }} /></div>
      <div className="resource-detail">{resource.detail}</div>
    </motion.article>
  );
}
