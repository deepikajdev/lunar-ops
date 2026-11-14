export const mission = { name: 'Artemis Ridge Outpost', id: 'LO-01', day: 18, totalDays: 30, phase: 'Surface operations', crewCount: 4 };

export const resources = [
  { name: 'Oxygen', value: 78, unit: '%', detail: '18.7 days estimated', icon: 'oxygen', tone: 'cyan', trend: 'Stable reserve' },
  { name: 'Water', value: 64, unit: '%', detail: '12.4 days estimated', icon: 'water', tone: 'blue', trend: 'Within parameters' },
  { name: 'Power', value: 91, unit: '%', detail: 'Solar array · charging', icon: 'power', tone: 'amber', trend: 'Array nominal' },
  { name: 'Food', value: 72, unit: '%', detail: '21.6 days estimated', icon: 'food', tone: 'green', trend: 'Stable reserve' },
];

export const crew = [
  { name: 'Maya Chen', role: 'Mission Commander', initials: 'MC', status: 'On EVA', color: 'violet' },
  { name: 'Elias Okafor', role: 'Flight Engineer', initials: 'EO', status: 'Habitat', color: 'teal' },
  { name: 'Sofia Alvarez', role: 'Science Specialist', initials: 'SA', status: 'Habitat', color: 'coral' },
  { name: 'Noah Williams', role: 'Systems Officer', initials: 'NW', status: 'Rest cycle', color: 'blue' },
];

export const alerts = [
  { severity: 'advisory', title: 'Dust accumulation detected', detail: 'Solar array 02 · 14:18 LST', icon: 'dust' },
  { severity: 'info', title: 'EVA window closes in 42 min', detail: 'Crew member · Maya Chen', icon: 'clock' },
];

export const activity = [
  { time: '14:18', title: 'Solar array 02 reported reduced output', detail: 'Power systems · Advisory', tone: 'amber' },
  { time: '13:52', title: 'EVA check-in received', detail: 'Maya Chen · Shackleton traverse', tone: 'cyan' },
  { time: '12:30', title: 'Water reclamation cycle complete', detail: 'Life support · Nominal', tone: 'green' },
];
