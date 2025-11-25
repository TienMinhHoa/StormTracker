'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { geoServerConfig, getWMSTileUrl } from '../../config/geoserver.config';
import TimeControls from './TimeControls';
import ZoomControls from './ZoomControls';
import WindLegend from './WindLegend';
import WindLayer from './WindLayer';
import WindParticlesLayer from './WindParticlesLayer';
import StormTrackLayer from './StormTrackLayer';
import MapInfo from './MapInfo';
import { RescueRequest } from '../rescue';
import { AVAILABLE_TIMESTAMPS } from './services/tiffService';
import { getStormTracks, type Storm, type StormTrack } from '../../services/stormApi';
import { getSafeImageUrl, DEFAULT_NEWS_IMAGE } from '../../utils/imageUtils';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type MapProps = {
  onMapReady?: (flyToLocation: (lng: number, lat: number, zoom?: number) => void) => void;
  rescueRequests?: RescueRequest[];
  newsItems?: Array<{ id: number; coordinates: [number, number]; title: string; image: string; category: string }>;
  activeTab?: 'news' | 'rescue' | 'damage' | 'warnings' | 'chatbot';
  onNewsClick?: (news: any) => void;
  selectedStorm?: Storm | null;
  showNewsMarkers?: boolean;
  showRescueMarkers?: boolean;
  warningItems?: Array<{ 
    id: number; 
    lat: number; 
    lon: number; 
    commune_name: string;
    district_name: string;
    provinceName: string;
    nguycosatlo: string;
    nguycoluquet: string;
    luongmuatd_db: number;
  }>;
  onWarningClick?: (warning: any) => void;
};

export default function Map({ onMapReady, rescueRequests = [], newsItems = [], activeTab = 'news', onNewsClick, selectedStorm, showNewsMarkers = true, showRescueMarkers = true, warningItems = [], onWarningClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const rescueMarkers = useRef<mapboxgl.Marker[]>([]);
  const newsMarkers = useRef<mapboxgl.Marker[]>([]);
  const warningMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapState, setMapState] = useState({
    lat: 21.0278,
    lng: 105.8342,
    zoom: 6,
  });

  // Wind layer state - always enabled
  const [windOpacity, setWindOpacity] = useState(1.0);
  const [windTimestamp, setWindTimestamp] = useState<string>('');
  const [windLoading, setWindLoading] = useState(false);
  const [windData, setWindData] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Wind animation state - controlled by toggle
  const [windAnimationEnabled, setWindAnimationEnabled] = useState(false);
  
  // Storm tracks state
  const [stormTracks, setStormTracks] = useState<StormTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  // Set default timestamp on mount
  useEffect(() => {
    if (!windTimestamp && AVAILABLE_TIMESTAMPS.length > 0) {
      setWindTimestamp(AVAILABLE_TIMESTAMPS[0].timestamp);
    }
  }, []);

  // Load storm tracks when selectedStorm changes or map becomes ready
  useEffect(() => {
    const loadTracks = async () => {
      if (!selectedStorm?.storm_id) {
        setStormTracks([]);
        return;
      }

      // Wait for map to be ready before loading tracks
      if (!mapReady || !map.current) {
        console.log('⏳ Waiting for map to be ready before loading tracks...');
        return;
      }

      try {
        setLoadingTracks(true);
        console.log(`🌪️ Loading tracks for storm: ${selectedStorm.storm_id}`);
        const tracks = await getStormTracks(selectedStorm.storm_id);
        console.log(`✅ Loaded ${tracks.length} tracks`);
        setStormTracks(tracks);
      } catch (error) {
        console.error('❌ Failed to load storm tracks:', error);
        setStormTracks([]);
      } finally {
        setLoadingTracks(false);
      }
    };

    loadTracks();
  }, [selectedStorm, mapReady]);

  // Storm track always enabled
  const stormTrackEnabled = false; // Temporarily disabled due to timing issues

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
      
      // Trigger re-render for components that depend on map
      setMapReady(true);
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

    // Only create markers if news tab is active and showNewsMarkers is enabled
    if (activeTab !== 'news' || !showNewsMarkers) return;

    // Category color mapping
    const categoryColors: Record<string, string> = {
      'Dự báo & Cảnh báo': '#eab308', // Yellow for warnings/forecasts
      'Hỗ trợ & Cứu trợ': '#2563eb', // Blue for rescue/support
      'Thiệt hại & Hậu quả': '#dc2626', // Red for damage
      // Fallback for old categories
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
      const safeImageUrl = getSafeImageUrl(news.image);

      // Create custom marker element with thumbnail image
      const el = document.createElement('div');
      el.className = 'news-marker';
      el.style.width = '48px';
      el.style.height = '48px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      el.style.cursor = 'pointer';
      el.style.overflow = 'hidden';
      el.style.backgroundImage = `url(${safeImageUrl})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
      
      // Handle image load error for marker background
      const markerImg = new Image();
      markerImg.onerror = () => {
        el.style.backgroundImage = `url(${DEFAULT_NEWS_IMAGE})`;
      };
      markerImg.src = safeImageUrl;

      // Create popup with news info
      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: false,
        className: 'news-popup'
      }).setHTML(`
        <div style="padding: 0; width: 250px; overflow: hidden;">
          <img src="${safeImageUrl}" alt="${news.title}" style="width: 100%; height: 120px; object-fit: cover; display: block;" onerror="this.src='${DEFAULT_NEWS_IMAGE}'" />
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
  }, [newsItems, activeTab, showNewsMarkers]);

  // Add rescue markers
  useEffect(() => {
    if (!map.current || !rescueRequests) return;

    // Remove old rescue markers
    rescueMarkers.current.forEach((m) => m.remove());
    rescueMarkers.current = [];

    // Only create markers if rescue tab is active and showRescueMarkers is enabled
    if (activeTab !== 'rescue' || !showRescueMarkers) return;

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
  }, [rescueRequests, activeTab, showRescueMarkers]);

  // Warning markers effect
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing warning markers
    warningMarkers.current.forEach(marker => marker.remove());
    warningMarkers.current = [];

    // Only show warnings when warnings tab is active
    if (activeTab !== 'warnings' || warningItems.length === 0) return;

    console.log(`⚠️ Adding ${warningItems.length} warning markers to map`);

    warningItems.forEach((warning) => {
      const { id, commune_id, commune_id_2cap, lon, lat, commune_name, district_name, provinceName, nguycosatlo, nguycoluquet, luongmuatd_db } = warning;
      const uniqueKey = `${id}-${commune_id}-${commune_id_2cap}`;

      // Determine max risk level
      const maxRisk = nguycosatlo === 'Rất cao' || nguycoluquet === 'Rất cao' ? 'Rất cao' :
                     nguycosatlo === 'Cao' || nguycoluquet === 'Cao' ? 'Cao' :
                     nguycosatlo === 'Trung bình' || nguycoluquet === 'Trung bình' ? 'Trung bình' : 'Thấp';

      // Risk colors
      const riskColors: Record<string, string> = {
        'Rất cao': '#ef4444',
        'Cao': '#f97316',
        'Trung bình': '#eab308',
        'Thấp': '#22c55e',
      };
      const color = riskColors[maxRisk] || '#6b7280';

      // Create marker element
      const el = document.createElement('div');
      el.className = 'warning-marker';
      el.dataset.warningKey = uniqueKey;
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.color = 'white';
      el.style.fontSize = '14px';
      el.innerHTML = '⚠️';

      // Add pulsing animation for high risks
      if (maxRisk === 'Rất cao' || maxRisk === 'Cao') {
        el.style.animation = 'pulse 2s infinite';
      }

      // Create popup
      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: false,
        className: 'warning-popup'
      }).setHTML(`
        <div style="padding: 12px; min-width: 240px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${color}; font-size: 14px;">
            ${maxRisk.toUpperCase()}
          </h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Khu vực:</strong> ${commune_name}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Huyện:</strong> ${district_name}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Tỉnh:</strong> ${provinceName}</p>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;" />
          ${nguycosatlo ? `<p style="margin: 4px 0; font-size: 12px;">🏔️ Sạt lở: <strong style="color: ${riskColors[nguycosatlo] || '#999'}">${nguycosatlo}</strong></p>` : ''}
          ${nguycoluquet ? `<p style="margin: 4px 0; font-size: 12px;">🌊 Lũ quét: <strong style="color: ${riskColors[nguycoluquet] || '#999'}">${nguycoluquet}</strong></p>` : ''}
          <p style="margin: 4px 0; font-size: 12px;">☔ Lượng mưa: <strong>${luongmuatd_db}mm</strong></p>
        </div>
      `);

      // Click handler
      el.addEventListener('click', () => {
        if (onWarningClick) {
          onWarningClick(warning);
        }
        if (map.current) {
          map.current.flyTo({
            center: [lon, lat],
            zoom: 11,
            duration: 2000,
          });
        }
      });

      // Create and add marker
      const warningMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map.current!);

      warningMarkers.current.push(warningMarker);
    });
  }, [warningItems, activeTab, onWarningClick, mapReady]);

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
    console.log('🌀 Wind animation toggled:', enabled);
    setWindAnimationEnabled(enabled);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0a1929]">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Wind Layer with real data - always enabled */}
      <WindLayer
        map={map.current}
        enabled={true}
        opacity={windOpacity}
        timestamp={windTimestamp}
        onLoadingChange={setWindLoading}
        onDataLoaded={setWindData}
      />

      {/* Wind Particles Layer - Custom WebGL implementation (Windy.com style) */}
      {/* TEMPORARILY DISABLED - Will implement later */}
      {/* {windAnimationEnabled && (
        <WindParticlesLayer
          map={map.current}
          enabled={windAnimationEnabled}
          timestamp={windTimestamp}
          opacity={0.9}
        />
      )} */}

      {/* Storm Track Layer (new visualization with pulse animation) */}
      {mapReady && selectedStorm && (
        <StormTrackLayer
          map={map.current}
          enabled={true}
          tracks={stormTracks}
        />
      )}

      {/* Docked Controls Row */}
      <div className="absolute bottom-4 left-0 right-24 z-10 px-4 pointer-events-none">
        <div className="flex w-full items-end gap-6">
          <TimeControls
            currentTimestamp={windTimestamp}
            onTimestampChange={setWindTimestamp}
            selectedStorm={selectedStorm}
            className="pointer-events-auto flex-1 ml-80"
          />

          <WindLegend
            opacity={windOpacity}
            timestamp={windTimestamp}
            isLoading={windLoading}
            onOpacityChange={setWindOpacity}
            onWindAnimationToggle={handleWindAnimationToggle}
            className="pointer-events-auto"
          />
        </div>
      </div>

      {/* Zoom Controls - Zoom buttons and Location */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocationClick={handleLocationClick}
      />

      {/* Map Info - Coordinates and Zoom level */}
      <MapInfo lat={mapState.lat} lng={mapState.lng} zoom={mapState.zoom} />
    </div>
  );
}
