export type NewsItem = {
  id: number;
  title: string;
  image: string; // thumbnail_url from API
  coordinates: [number, number]; // [longitude, latitude]
  category: string;
  date: string;
  author: string;
  content: string;
  source_url?: string; // URL to original news source
  severity?: 'high' | 'medium' | 'low'; // For warnings
  duration?: string; // For warnings
};

export const newsItems: NewsItem[] = [
  {
    id: 1,
    title: "New satellite images show Hurricane Leo's path",
    image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=400&h=300&fit=crop',
    coordinates: [105.8342, 21.0278], // Hà Nội
    category: 'Hurricane',
    date: 'Nov 14, 2024',
    author: 'Weather Team',
    content: `Hurricane Leo has intensified to a Category 4 storm, with maximum sustained winds reaching 130 mph. New satellite imagery from NOAA shows the hurricane's eye wall is well-defined and the storm continues to track westward.

Meteorologists are closely monitoring Hurricane Leo as it approaches the coastal regions. The storm has grown in size and intensity over the past 24 hours, with hurricane-force winds extending outward up to 70 miles from the center.

Residents in affected areas are urged to complete their preparations and heed evacuation orders. Storm surge of 10-15 feet is possible along the coast, along with heavy rainfall that could cause significant flooding in low-lying areas.

The National Hurricane Center has issued hurricane warnings for several coastal counties. Emergency management officials are coordinating with local authorities to ensure shelters are open and ready to receive evacuees.`,
  },
  {
    id: 2,
    title: "Understanding the new 'Tornado Alley' shift",
    image: 'https://images.unsplash.com/photo-1601134467661-3d775b999c8f?w=400&h=300&fit=crop',
    coordinates: [108.2022, 16.0544], // Đà Nẵng
    category: 'Tornado',
    date: 'Nov 13, 2024',
    author: 'Climate Research Team',
    content: `Recent data shows a significant shift in tornado activity patterns across the region. Scientists have observed that the traditional "Tornado Alley" is expanding and shifting eastward.

Climate scientists attribute this change to several factors, including warming ocean temperatures and shifting atmospheric patterns. The research, conducted over a 20-year period, shows a clear trend in tornado frequency and intensity.

Communities that previously saw few tornadoes are now experiencing increased activity. This has prompted emergency management officials to update their preparedness plans and warning systems.

Experts recommend that all residents in affected areas have a tornado safety plan, including knowing where to shelter and how to receive emergency alerts.`,
  },
  {
    id: 3,
    title: 'How to prepare for flash flood events',
    image: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400&h=300&fit=crop',
    coordinates: [106.6297, 10.8231], // TP HCM
    category: 'Flood',
    date: 'Nov 12, 2024',
    author: 'Safety Team',
    content: `Flash flooding is one of the most dangerous weather hazards. Here's what you need to know to stay safe.

Flash floods can occur within minutes or hours of heavy rainfall, dam or levee failure, or sudden release of water. They are characterized by a rapid rise in water levels and can carry debris, damage infrastructure, and create life-threatening situations.

Key preparation steps:
- Know your flood risk and evacuation routes
- Prepare an emergency kit with supplies for at least 3 days
- Sign up for emergency alerts
- Never drive through flooded roadways
- Move to higher ground immediately if flooding begins

Remember: Turn Around, Don't Drown. Just 6 inches of moving water can knock you down, and 12 inches can sweep away most vehicles.`,
  },
  {
    id: 4,
    title: 'Wildfire smoke tracker: Air quality updates',
    image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=300&fit=crop',
    coordinates: [107.5847, 16.4637], // Huế
    category: 'Wildfire',
    date: 'Nov 11, 2024',
    author: 'Air Quality Team',
    content: `Wildfire smoke from regional fires continues to impact air quality across multiple counties. Real-time monitoring shows particulate matter levels reaching unhealthy levels.

The smoke plume is expected to persist for several more days as firefighters work to contain the blazes. Residents are advised to limit outdoor activities and keep windows and doors closed.

Sensitive groups, including children, elderly, and those with respiratory conditions, should take extra precautions. Consider using air purifiers indoors and wearing N95 masks if you must go outside.

Check local air quality index (AQI) readings regularly and follow recommendations from health officials. School districts may modify outdoor activities based on air quality conditions.`,
  },
  {
    id: 5,
    title: 'Storm chasers capture incredible lightning strikes',
    image: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=400&h=300&fit=crop',
    coordinates: [105.4117, 9.7781], // Cần Thơ
    category: 'Storm',
    date: 'Nov 10, 2024',
    author: 'Storm Chasers',
    content: `A team of storm chasers documented an extraordinary lightning display during last night's severe thunderstorm. The footage shows multiple cloud-to-ground strikes and rare ball lightning.

The storm produced over 10,000 lightning strikes in a 3-hour period, creating a spectacular light show visible for miles. Meteorologists say the unusual lightning activity was due to extreme atmospheric instability.

Lightning killed an average of 20 people per year in the US over the last decade. Remember to seek shelter immediately when thunder roars. You're not safe outside until 30 minutes after the last thunder.

The storm also produced large hail and damaging winds, causing power outages and property damage. Repair crews are working to restore services to affected areas.`,
  },
  {
    id: 6,
    title: 'NOAA releases its 2024 hurricane season outlook',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
    coordinates: [109.1967, 12.2388], // Nha Trang
    category: 'Hurricane',
    date: 'Nov 9, 2024',
    author: 'NOAA',
    content: `The National Oceanic and Atmospheric Administration (NOAA) has released its seasonal hurricane forecast, predicting an above-average season with 14-21 named storms.

Of those, 6-11 could become hurricanes, including 2-5 major hurricanes (Category 3 or higher). The forecast is based on several climate factors, including warmer-than-average sea surface temperatures.

NOAA Administrator emphasized the importance of preparation: "Now is the time to make sure your family has an emergency plan and disaster supply kit ready."

Key factors contributing to the active forecast include:
- Warm Atlantic sea surface temperatures
- La Niña conditions expected to develop
- Reduced wind shear in the hurricane formation region
- Active West African monsoon

Coastal residents should review their hurricane plans and ensure they're ready to act quickly if a storm threatens their area.`,
  },
  // Weather Warnings
  {
    id: 7,
    title: 'Tropical Storm Alert',
    image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&h=300&fit=crop',
    coordinates: [106.8, 20.9], // Coastal Region
    category: 'Warning',
    date: '2h ago',
    author: 'Emergency Alert System',
    severity: 'high',
    duration: '12 hours',
    content: `Strong winds and heavy rainfall expected. Secure loose objects and prepare for potential power outages. Evacuation routes are marked on the map.

Tropical storm conditions are expected to develop within the next 6-12 hours. Wind speeds may reach 60-70 mph with gusts up to 85 mph. Heavy rainfall of 4-8 inches is forecast.

Residents should:
- Secure outdoor furniture and objects
- Stock up on emergency supplies
- Charge electronic devices
- Know evacuation routes
- Follow local emergency management guidance

Power outages are likely. Stay away from downed power lines and report them immediately to authorities.`,
  },
  {
    id: 8,
    title: 'Flash Flood Warning',
    image: 'https://images.unsplash.com/photo-154768305-902d1b84169f?w=400&h=300&fit=crop',
    coordinates: [106.5, 10.7], // River Valley
    category: 'Warning',
    date: '5h ago',
    author: 'National Weather Service',
    severity: 'medium',
    content: `Flash Flood Warning for River Valley and Lowland Plains. Heavy rainfall has caused rapid water level rises in local streams and rivers.

DO NOT attempt to drive through flooded areas. Turn around, don't drown. Just 6 inches of moving water can knock you down, and 12 inches can carry away most vehicles.

If you are in a flood-prone area, move to higher ground immediately. Avoid walking or driving through flood waters. Stay informed through weather radio or emergency alerts.

This warning remains in effect until further notice. Monitor local conditions and follow guidance from emergency management officials.`,
  },
  {
    id: 9,
    title: 'High Surf Advisory',
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=300&fit=crop',
    coordinates: [109.3, 12.1], // Southern Beaches
    category: 'Warning',
    date: '8h ago',
    author: 'Coast Guard',
    severity: 'low',
    content: `High Surf Advisory in effect for Southern Beaches. Large breaking waves of 8 to 12 feet are expected along the coast.

Beach-goers should exercise extreme caution. Strong rip currents are present and can pull swimmers away from shore. If caught in a rip current, swim parallel to shore until free, then swim back to land.

Small craft advisories are in effect. Boaters should avoid venturing out to sea. Coastal erosion and flooding of low-lying areas is possible during high tide.

Stay out of the water and away from rocks and jetties. Never turn your back to the ocean.`,
  },
  {
    id: 10,
    title: 'Thunderstorm Watch',
    image: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=400&h=300&fit=crop',
    coordinates: [107.0, 16.5], // Inland Counties
    category: 'Warning',
    date: '10h ago',
    author: 'Weather Service',
    severity: 'medium',
    content: `Severe Thunderstorm Watch issued for Inland Counties. Conditions are favorable for the development of severe thunderstorms with large hail, damaging winds, and possible tornadoes.

Stay weather aware and be prepared to take shelter. Have multiple ways to receive weather warnings. When thunder roars, go indoors. You're not safe outside until 30 minutes after the last thunder.

Severe weather indicators:
- Dark, greenish sky
- Large, dark low-lying clouds
- Large hail
- Loud roar similar to a freight train

If a tornado warning is issued, take shelter immediately in a basement or interior room on the lowest floor.`,
  },
];
