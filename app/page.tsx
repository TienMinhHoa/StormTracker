'use client';

import { useRef } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import { NewsItem } from './components/NewsTab';

export default function Home() {
  const flyToLocationRef = useRef<((lng: number, lat: number, zoom?: number, imageUrl?: string) => void) | null>(null);

  const handleMapReady = (flyToLocation: (lng: number, lat: number, zoom?: number, imageUrl?: string) => void) => {
    flyToLocationRef.current = flyToLocation;
  };

  const handleNewsClick = (news: NewsItem) => {
    console.log('📍 News clicked:', news.title, news.coordinates);
    
    // Zoom to news location with image marker
    if (flyToLocationRef.current) {
      const [lng, lat] = news.coordinates;
      flyToLocationRef.current(lng, lat, 10, news.image);
    }
  };

  return (
    <main className="relative h-screen w-full bg-[#101922]">
      <Sidebar onNewsClick={handleNewsClick} />
      <div className="absolute inset-0">
        <Map onMapReady={handleMapReady} />
      </div>
    </main>
  );
}
