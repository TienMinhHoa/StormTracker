'use client';

import { useState } from 'react';
import NewsDetail from './NewsDetail';

const categories = ['All', 'Category 1', 'Category 2', 'Category 3', 'Category 4'];

export type NewsItem = {
  id: number;
  title: string;
  image: string;
  coordinates: [number, number]; // [longitude, latitude]
  category: string;
  date: string;
  author: string;
  content: string;
};

const newsItems: NewsItem[] = [
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
];

type NewsTabProps = {
  onNewsClick?: (news: NewsItem) => void;
};

export default function NewsTab({ onNewsClick }: NewsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const handleNewsClick = (news: NewsItem) => {
    setSelectedNews(news);
    onNewsClick?.(news);
  };

  const handleBack = () => {
    setSelectedNews(null);
  };

  // Show detail view if a news item is selected
  if (selectedNews) {
    return <NewsDetail news={selectedNews} onBack={handleBack} />;
  }

  // Show list view
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-[#137fec] text-white'
                    : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-2 gap-4">
            {newsItems.map((item) => (
              <div key={item.id} className="flex flex-col gap-2">
                <button
                  onClick={() => handleNewsClick(item)}
                  className="block group w-full text-left"
                >
                  <div
                    className="aspect-video w-full rounded-lg bg-cover bg-center bg-gray-800 group-hover:opacity-80 transition-opacity"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                </button>
                <h3 className="text-sm font-medium leading-snug text-white">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

