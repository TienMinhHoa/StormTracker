'use client';

import { useRef, useState } from 'react';
import { Map } from './components/map';
import { Sidebar } from './components/sidebar';
import { NewsItem, newsItems } from './components/news';
import { RescueRequest, rescueRequests } from './components/rescue';

export default function Home() {
  const flyToLocationRef = useRef<((lng: number, lat: number, zoom?: number) => void) | null>(null);
  const [activeTab, setActiveTab] = useState<'news' | 'rescue' | 'chatbot'>('news');
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);

  const handleMapReady = (flyToLocation: (lng: number, lat: number, zoom?: number) => void) => {
    flyToLocationRef.current = flyToLocation;
  };

  const handleTabChange = (tab: 'news' | 'rescue' | 'chatbot') => {
    setActiveTab(tab);
    // Clear selected news when changing tabs
    if (tab !== 'news') {
      setSelectedNewsId(null);
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
        onTabChange={handleTabChange}
        selectedNewsId={selectedNewsId}
      />
      <div className="absolute inset-0">
        <Map
          onMapReady={handleMapReady}
          rescueRequests={rescueRequests}
          newsItems={newsItems}
          activeTab={activeTab}
          onNewsClick={handleNewsClick}
        />
      </div>
    </main>
  );
}
