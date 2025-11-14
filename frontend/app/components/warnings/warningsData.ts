export type Warning = {
  id: number;
  title: string;
  location: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
  color: 'red' | 'yellow' | 'green';
  description?: string;
  duration?: string;
};

export const warnings: Warning[] = [
  {
    id: 1,
    title: 'Tropical Storm Alert',
    location: 'Coastal Region, Bay Area',
    time: '2h ago',
    severity: 'high',
    color: 'red',
    description:
      'Strong winds and heavy rainfall expected. Secure loose objects and prepare for potential power outages. Evacuation routes are marked on the map.',
    duration: '12 hours',
  },
  {
    id: 2,
    title: 'Flash Flood Warning',
    location: 'River Valley, Lowland Plains',
    time: '5h ago',
    severity: 'medium',
    color: 'yellow',
  },
  {
    id: 3,
    title: 'High Surf Advisory',
    location: 'Southern Beaches',
    time: '8h ago',
    severity: 'low',
    color: 'green',
  },
  {
    id: 4,
    title: 'Thunderstorm Watch',
    location: 'Inland Counties',
    time: '10h ago',
    severity: 'medium',
    color: 'yellow',
  },
];
