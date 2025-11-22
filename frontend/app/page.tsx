'use client';

import { useRef, useState } from 'react';
import { Map } from './components/map';
import { Sidebar } from './components/sidebar';
import { NewsItem, newsItems } from './components/news';
import { RescueRequest, rescueRequests } from './components/rescue';
import type { Storm } from './services/stormApi';

export default function Home() {
  const flyToLocationRef = useRef<((lng: number, lat: number, zoom?: number) => void) | null>(null);
  const [activeTab, setActiveTab] = useState<'news' | 'rescue' | 'damage' | 'chatbot'>('news');
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);
  const [selectedStorm, setSelectedStorm] = useState<Storm | null>(null); // Will be set by Sidebar when storms load

  const handleMapReady = (flyToLocation: (lng: number, lat: number, zoom?: number) => void) => {
    flyToLocationRef.current = flyToLocation;
  };

  const handleTabChange = (tab: 'news' | 'rescue' | 'damage' | 'chatbot') => {
    setActiveTab(tab);
    // Clear selected news when changing tabs
    if (tab !== 'news') {
      setSelectedNewsId(null);
    }
  };

  const handleStormChange = (storm: Storm) => {
    console.log('🌪️ Storm changed:', storm.name);
    setSelectedStorm(storm);
  };

  const handleDamageClick = (damage: any) => {
    console.log('🏗️ Damage clicked:', damage);

    // Zoom to damage location
    if (flyToLocationRef.current && damage.lat && damage.lon) {
      flyToLocationRef.current(damage.lon, damage.lat, 10);
    }
  };

  const handleNewsClick = (news: NewsItem) => {
    console.log('📍 News clicked:', news.title, news.coordinates);

    // Set selected news id to trigger detail view
    setSelectedNewsId(news.id);

    // Make sure we're on news tab
    if (activeTab !== 'news') {
      setActiveTab('news');
    }

    // Zoom to news location
    if (flyToLocationRef.current && news.coordinates && Array.isArray(news.coordinates)) {
      const [lng, lat] = news.coordinates;
      flyToLocationRef.current(lng, lat, 10);
    }
  };

  const handleRescueClick = (rescue: RescueRequest) => {
    console.log('🚨 Rescue clicked:', rescue.name, rescue.coordinates);

    // Zoom to rescue location
    if (flyToLocationRef.current && rescue.coordinates && Array.isArray(rescue.coordinates)) {
      const [lng, lat] = rescue.coordinates;
      // Use a default rescue marker image or create a custom marker
      flyToLocationRef.current(lng, lat, 12);
    }
  };

  return (
    <main className="relative h-screen w-full bg-[#101922]">
      <Sidebar
        onNewsClick={handleNewsClick}
        onRescueClick={handleRescueClick}
        onDamageClick={handleDamageClick}
        onTabChange={handleTabChange}
        onStormChange={handleStormChange}
        selectedNewsId={selectedNewsId}
        selectedStorm={selectedStorm}
      />
      <div className="absolute inset-0">
        <Map
          onMapReady={handleMapReady}
          rescueRequests={rescueRequests}
          newsItems={newsItems}
          activeTab={activeTab}
          onNewsClick={handleNewsClick}
          selectedStorm={selectedStorm}
        />
      </div>
    </main>
  );
}
