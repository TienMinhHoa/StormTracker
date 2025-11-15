'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { geoServerConfig, getWMSTileUrl } from '../../config/geoserver.config';
import MapControls from './MapControls';
import ZoomControls from './ZoomControls';
import WindLegend from './WindLegend';
import WindLayer from './WindLayer';
import StormTrack from './StormTrack';
import MapInfo from './MapInfo';
import { RescueRequest } from '../rescue';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type MapProps = {
  onMapReady?: (flyToLocation: (lng: number, lat: number, zoom?: number) => void) => void;
  rescueRequests?: RescueRequest[];
  newsItems?: Array<{ id: number; coordinates: [number, number]; title: string; image: string; category: string }>;
  activeTab?: 'news' | 'rescue' | 'chatbot';
  onNewsClick?: (news: any) => void;
};

export default function Map({ onMapReady, rescueRequests = [], newsItems = [], activeTab = 'news', onNewsClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const rescueMarkers = useRef<mapboxgl.Marker[]>([]);
  const newsMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapState, setMapState] = useState({
    lat: 21.0278,
    lng: 105.8342,
    zoom: 6,
  });

  // Wind layer state - always enabled
  const [windOpacity, setWindOpacity] = useState(0.7);
  const [windForecastHour, setWindForecastHour] = useState(0);
  const [windLoading, setWindLoading] = useState(false);
  const [windData, setWindData] = useState<any>(null);

  // Storm track always enabled
  const stormTrackEnabled = true;

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      // Sử dụng style đơn giản từ Mapbox
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [105.8342, 21.0278],
      zoom: 6,
      minZoom: 2,
      maxZoom: 12,
      // Không giới hạn khu vực - cho phép xem toàn cầu
      // maxBounds: undefined,
      // Sử dụng projection 2D như Windy.com
      projection: 'mercator' as any,
      // Tắt các tính năng 3D
      pitch: 0,
      bearing: 0,
      // Tắt terrain 3D
      // terrain: undefined,
    });

    map.current = newMap;

    // Expose flyToLocation function to parent component
    const flyToLocation = (lng: number, lat: number, zoom: number = 10) => {
      if (!map.current) return;

      // Fly to location
      map.current.flyTo({
        center: [lng, lat],
        zoom: zoom,
        duration: 2000,
      });
    };

    newMap.on('load', () => {
      // Tùy chỉnh màu sắc để giống Windy
      // newMap.setPaintProperty('background', 'background-color', '#0a1929');

      // Call onMapReady callback with flyToLocation function
      onMapReady?.(flyToLocation);

      // Boundaries sẽ được thêm trong WindLayer component (overlay lên trên wind layer)

      console.log('🗺️ Map loaded successfully');
    });

    // Update map state on move
    newMap.on('move', () => {
      const center = newMap.getCenter();
      const zoom = newMap.getZoom();
      setMapState({
        lat: center.lat,
        lng: center.lng,
        zoom,
      });
    });

    // Không cần enforce bounds nữa - cho phép xem toàn cầu

    // Cleanup
    return () => {
      if (marker.current) {
        marker.current.remove();
      }
      rescueMarkers.current.forEach((m) => m.remove());
      newsMarkers.current.forEach((m) => m.remove());
      newMap.remove();
    };
  }, []);

  // Add news markers
  useEffect(() => {
    if (!map.current || !newsItems) return;

    // Remove old news markers
    newsMarkers.current.forEach((m) => m.remove());
    newsMarkers.current = [];

    // Only create markers if news tab is active
    if (activeTab !== 'news') return;

    // Category color mapping
    const categoryColors: Record<string, string> = {
      Hurricane: '#dc2626',
      Tornado: '#ea580c',
      Flood: '#2563eb',
      Storm: '#7c3aed',
      Warning: '#eab308',
      Wildfire: '#f59e0b',
    };

    // Add news markers
    newsItems.forEach((news) => {
      const [lng, lat] = news.coordinates;
      const color = categoryColors[news.category] || '#6b7280';

      // Create custom marker element - single style for all news
      const el = document.createElement('div');
      el.className = 'news-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3b82f6'; // Blue color for all news
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.color = 'white';
      el.style.fontSize = '16px';
      el.innerHTML = '📰';

      // Create popup with news info
      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: false,
        className: 'news-popup'
      }).setHTML(`
        <div style="padding: 0; width: 250px; overflow: hidden;">
          <img src="${news.image}" alt="${news.title}" style="width: 100%; height: 120px; object-fit: cover; display: block;" />
          <div style="padding: 12px;">
            <span style="display: inline-block; padding: 4px 10px; background: ${color}; color: white; border-radius: 12px; font-size: 11px; font-weight: bold; margin-bottom: 8px;">
              ${news.category}
            </span>
            <h3 style="margin: 0; font-weight: bold; font-size: 14px; line-height: 1.4;">
              ${news.title}
            </h3>
          </div>
        </div>
      `);

      // Add click event to open news detail in sidebar and zoom
      el.addEventListener('click', () => {
        // Call the callback to show news detail in sidebar
        onNewsClick?.(news);
        
        // Zoom to the marker location
        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 10,
            duration: 2000,
          });
        }
      });

      // Create and add marker
      const newsMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      newsMarkers.current.push(newsMarker);
    });
  }, [newsItems, activeTab]);

  // Add rescue markers
  useEffect(() => {
    if (!map.current || !rescueRequests) return;

    // Remove old rescue markers
    rescueMarkers.current.forEach((m) => m.remove());
    rescueMarkers.current = [];

    // Only create markers if rescue tab is active
    if (activeTab !== 'rescue') return;

    // Add rescue markers
    rescueRequests.forEach((rescue) => {
      const [lng, lat] = rescue.coordinates;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'rescue-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#ef4444'; // Red color for rescue
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.color = 'white';
      el.style.fontSize = '16px';
      el.innerHTML = '🆘';

      // Add pulsing animation for critical/high urgency
      if (rescue.urgency === 'critical' || rescue.urgency === 'high') {
        el.style.animation = 'pulse 2s infinite';
      }

      // Get urgency color for popup
      const urgencyColors: Record<string, string> = {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#eab308',
        low: '#22c55e',
      };
      const urgencyColor = urgencyColors[rescue.urgency] || '#6b7280';

      // Create popup with rescue info
      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: false,
        className: 'rescue-popup'
      }).setHTML(`
        <div style="padding: 12px; min-width: 220px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${urgencyColor}; font-size: 14px;">
            ${rescue.urgency.toUpperCase()} - ${rescue.category}
          </h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Tên:</strong> ${rescue.name}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Số người:</strong> ${rescue.numberOfPeople}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Địa chỉ:</strong> ${rescue.address}</p>
          <p style="margin: 6px 0 4px 0; font-size: 12px; color: #666;">${rescue.description}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">${rescue.timestamp}</p>
        </div>
      `);

      // Add click event to show rescue detail in sidebar
      el.addEventListener('click', () => {
        // Zoom to rescue location
        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 12,
            duration: 2000,
          });
        }
      });

      // Create and add marker with popup
      const rescueMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      rescueMarkers.current.push(rescueMarker);
    });
  }, [rescueRequests, activeTab]);

  // Zoom controls callbacks
  const handleZoomIn = useCallback(() => {
    if (map.current) {
      map.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (map.current) {
      map.current.zoomOut();
      
    }
  }, []);

  const handleLocationClick = useCallback(() => {
    console.log('🔍 handleLocationClick', mapState);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (map.current) {
            map.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 12,
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const handleWindAnimationToggle = useCallback((enabled: boolean) => {
    console.log('Wind animation toggled:', enabled);
    // TODO: Implement wind animation layer
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0a1929]">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Wind Layer with real data - always enabled */}
      <WindLayer
        map={map.current}
        enabled={true}
        opacity={windOpacity}
        forecastHour={windForecastHour}
        onLoadingChange={setWindLoading}
        onDataLoaded={setWindData}
      />

      {/* Storm Track Layer */}
      <StormTrack
        map={map.current}
        enabled={stormTrackEnabled}
      />

      {/* Map Controls - Removed */}
      <MapControls />

      {/* Zoom Controls - Zoom buttons and Location */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocationClick={handleLocationClick}
      />

      {/* Wind Legend with Controls */}
      <WindLegend
        opacity={windOpacity}
        forecastHour={windForecastHour}
        isLoading={windLoading}
        onOpacityChange={setWindOpacity}
        onForecastHourChange={setWindForecastHour}
        onWindAnimationToggle={handleWindAnimationToggle}
      />

      {/* Map Info - Coordinates and Zoom level */}
      <MapInfo lat={mapState.lat} lng={mapState.lng} zoom={mapState.zoom} />
    </div>
  );
}
