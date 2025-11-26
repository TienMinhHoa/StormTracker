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
import type { DamageNews } from '../../services/damageApi';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type MapProps = {
  onMapReady?: (flyToLocation: (lng: number, lat: number, zoom?: number) => void) => void;
  rescueRequests?: RescueRequest[];
  newsItems?: Array<{ id: number; coordinates: [number, number]; title: string; image: string; category: string }>;
  activeTab?: 'forecast' | 'rescue' | 'damage' | 'chatbot';
  onNewsClick?: (news: any) => void;
  onDamageNewsClick?: (damageNews: DamageNews) => void;
  selectedStorm?: Storm | null;
  showNewsMarkers?: boolean;
  showRescueMarkers?: boolean;
  showWarningMarkers?: boolean;
  showDamageMarkers?: boolean;
  damageNewsItems?: DamageNews[];
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
  onRescueRequestUpdate?: (requestId: number, status: 'completed' | 'safe_reported') => Promise<void>;
};

export default function Map({ onMapReady, rescueRequests = [], newsItems = [], activeTab = 'forecast', onNewsClick, onDamageNewsClick, selectedStorm, showNewsMarkers = true, showRescueMarkers = true, showWarningMarkers = true, showDamageMarkers = true, damageNewsItems = [], warningItems = [], onWarningClick, onRescueRequestUpdate }: MapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const rescueMarkers = useRef<mapboxgl.Marker[]>([]);
  const newsMarkers = useRef<mapboxgl.Marker[]>([]);
  const warningMarkers = useRef<mapboxgl.Marker[]>([]);
  const damageNewsMarkers = useRef<mapboxgl.Marker[]>([]);
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

      // Get marker color: green if completed or safe_reported, otherwise based on priority
      const getMarkerColor = (status: string, priority: number): string => {
        // If status is completed or safe_reported, always green
        if (status === 'completed' || status === 'safe_reported') {
          return '#22c55e'; // Green
        }
        // Otherwise, use priority-based color
        if (priority <= 1) return '#ef4444'; // Red - critical
        if (priority <= 2) return '#f97316'; // Orange - high
        if (priority <= 3) return '#eab308'; // Yellow - medium
        return '#22c55e'; // Green - low
      };

      const markerColor = getMarkerColor(rescue.status, rescue.priority || 3);
      // For popup, use priority-based color for urgency display
      const getUrgencyColor = (priority: number): string => {
        if (priority <= 1) return '#ef4444';
        if (priority <= 2) return '#f97316';
        if (priority <= 3) return '#eab308';
        return '#22c55e';
      };
      const urgencyColor = getUrgencyColor(rescue.priority || 3);

      // Create custom marker element with number of people
      const el = document.createElement('div');
      el.className = 'rescue-marker';
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = markerColor;
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.color = 'white';
      el.style.fontSize = '14px';
      el.innerHTML = rescue.numberOfPeople.toString();

      // Add pulsing animation for critical/high urgency (only if not completed/safe)
      if ((rescue.urgency === 'critical' || rescue.urgency === 'high') && 
          rescue.status !== 'completed' && rescue.status !== 'safe_reported') {
        el.style.animation = 'pulse 2s infinite';
      }

      // Create popup with rescue info and action buttons
      const statusLabel = rescue.status === 'pending' ? 'Đang tiếp nhận' :
                         rescue.status === 'completed' ? 'Đã hỗ trợ' :
                         rescue.status === 'safe_reported' ? 'Báo an toàn' : 'Đang cứu hộ';
      
      const urgencyLabel = rescue.urgency === 'critical' ? 'Cực kỳ khẩn cấp' :
                          rescue.urgency === 'high' ? 'Khẩn cấp' :
                          rescue.urgency === 'medium' ? 'Trung bình' : 'Không khẩn';
      
      const categoryLabel = rescue.category === 'medical' ? 'Y tế khẩn cấp' :
                           rescue.category === 'trapped' ? 'Bị mắc kẹt' :
                           rescue.category === 'food-water' ? 'Cần thức ăn/nước uống' :
                           rescue.category === 'evacuation' ? 'Cần sơ tán' : 'Khác';
      
      // Create popup with rescue info and action buttons
      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: false,
        className: 'rescue-popup'
      });

      const popupContent = document.createElement('div');
      popupContent.style.padding = '12px';
      popupContent.style.minWidth = '240px';
      
      popupContent.innerHTML = `
        <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${urgencyColor}; font-size: 14px;">
          ${urgencyLabel} - ${categoryLabel}
        </h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Tên:</strong> ${rescue.name}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Số điện thoại:</strong> ${rescue.phone || 'Chưa cung cấp'}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Số người:</strong> ${rescue.numberOfPeople}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Địa chỉ:</strong> ${rescue.address}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Trạng thái:</strong> ${statusLabel}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Mức độ ưu tiên:</strong> ${rescue.priority || 'N/A'}/5</p>
        <p style="margin: 6px 0 4px 0; font-size: 12px; color: #666;">${rescue.description}</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">${rescue.timestamp}</p>
        ${rescue.status !== 'completed' && rescue.status !== 'safe_reported' ? `
          <div style="margin-top: 8px; display: flex; gap: 4px;">
            <button id="btn-safe-${rescue.id}" style="flex: 1; padding: 6px; background: #14b8a6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">
              ✓ Báo an toàn
            </button>
            <button id="btn-completed-${rescue.id}" style="flex: 1; padding: 6px; background: #22c55e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">
              ✓ Đã hỗ trợ
            </button>
          </div>
        ` : ''}
      `;

      popup.setDOMContent(popupContent);

      // Add event listeners for buttons after popup is set
      if (rescue.status !== 'completed' && rescue.status !== 'safe_reported' && onRescueRequestUpdate) {
        // Use a closure to capture the rescue id and update function
        const rescueId = rescue.id;
        const updateHandler = onRescueRequestUpdate;
        
        // Wait for popup to be added to DOM
        setTimeout(() => {
          const safeBtn = popupContent.querySelector(`#btn-safe-${rescueId}`) as HTMLButtonElement;
          const completedBtn = popupContent.querySelector(`#btn-completed-${rescueId}`) as HTMLButtonElement;
          
          if (safeBtn) {
            safeBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                await updateHandler(rescueId, 'safe_reported');
                popup.remove();
              } catch (error) {
                console.error('Failed to update status:', error);
              }
            });
          }
          
          if (completedBtn) {
            completedBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                await updateHandler(rescueId, 'completed');
                popup.remove();
              } catch (error) {
                console.error('Failed to update status:', error);
              }
            });
          }
        }, 100);
      }

      // Add click event to show rescue detail in sidebar
      el.addEventListener('click', () => {
        // Zoom to rescue location
        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 6.5,
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

    // Auto-zoom to the rescue request with most people when entering rescue tab
    if (rescueRequests.length > 0 && map.current && mapReady) {
      const highestPriorityRequest = rescueRequests.reduce((max, request) => {
        const maxPeople = max.numberOfPeople || 0;
        const currentPeople = request.numberOfPeople || 0;
        // Prioritize by number of people, then by priority (lower priority number = higher urgency)
        if (currentPeople > maxPeople) return request;
        if (currentPeople === maxPeople && (request.priority || 5) < (max.priority || 5)) return request;
        return max;
      });

      // Zoom to the location with most people
      if (highestPriorityRequest.coordinates && highestPriorityRequest.coordinates.length === 2) {
        const [lng, lat] = highestPriorityRequest.coordinates;
        setTimeout(() => {
          if (map.current) {
            map.current.flyTo({
              center: [lng, lat],
              zoom: 6.5,
              duration: 2000,
            });
            console.log(`📍 Auto-zoomed to rescue request with ${highestPriorityRequest.numberOfPeople} people at [${lng}, ${lat}]`);
          }
        }, 500); // Small delay to ensure markers are rendered
      }
    }
  }, [rescueRequests, activeTab, showRescueMarkers, mapReady]);

  // Warning markers effect
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing warning markers
    warningMarkers.current.forEach(marker => marker.remove());
    warningMarkers.current = [];

    // Only show warnings when forecast tab is active and toggle is on
    if (activeTab !== 'forecast' || !showWarningMarkers || warningItems.length === 0) return;

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
            zoom: 6.5,
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
  }, [warningItems, activeTab, showWarningMarkers, onWarningClick, mapReady]);

  // Damage news markers effect
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing damage news markers
    damageNewsMarkers.current.forEach(marker => marker.remove());
    damageNewsMarkers.current = [];

    // Only show damage markers when damage tab is active and toggle is on
    if (activeTab !== 'damage' || !showDamageMarkers || damageNewsItems.length === 0) return;

    console.log(`🏗️ Adding ${damageNewsItems.length} damage news markers to map`);

    damageNewsItems.forEach((news) => {
      if (!news.lat || !news.lon) return;

      // Create marker element
      const el = document.createElement('div');
      el.className = 'damage-news-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#ef4444';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.4)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.color = 'white';
      el.style.fontSize = '16px';
      el.innerHTML = '🏗️';

      // Create popup with news preview
      const truncatedTitle = news.title.length > 60 ? news.title.substring(0, 60) + '...' : news.title;
      const truncatedContent = news.content.length > 100 ? news.content.substring(0, 100) + '...' : news.content;
      
      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: false,
        className: 'damage-news-popup',
        maxWidth: '300px'
      }).setHTML(`
        <div style="padding: 12px;">
          ${news.thumbnail_url ? `
            <img src="${news.thumbnail_url}" 
                 style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" 
                 alt="${truncatedTitle}"
                 onerror="this.src='https://cdnphoto.dantri.com.vn/V0A7pXa4T8wsbhHMmWmZti84Kkk=/2025/11/07/da-nang-1762483851451.jpg'" />
          ` : ''}
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #ef4444; font-size: 14px;">
            ${truncatedTitle}
          </h3>
          <p style="margin: 4px 0; font-size: 12px; color: #666; line-height: 1.4;">
            ${truncatedContent}
          </p>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="margin: 4px 0; font-size: 11px; color: #999;">
            📅 ${new Date(news.published_at).toLocaleDateString('vi-VN', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          ${news.source_url ? `
            <a href="${news.source_url}" 
               target="_blank" 
               rel="noopener noreferrer"
               style="display: inline-block; margin-top: 6px; color: #06b6d4; font-size: 11px; text-decoration: none;">
              🔗 Xem nguồn tin →
            </a>
          ` : ''}
        </div>
      `);

      // Click handler
      el.addEventListener('click', () => {
        if (onDamageNewsClick) {
          onDamageNewsClick(news);
        }
        if (map.current) {
          map.current.flyTo({
            center: [news.lon, news.lat],
            zoom: 6.5,
            duration: 2000,
          });
        }
      });

      // Create and add marker
      const damageMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([news.lon, news.lat])
        .setPopup(popup)
        .addTo(map.current!);

      damageNewsMarkers.current.push(damageMarker);
    });
  }, [damageNewsItems, activeTab, showDamageMarkers, onDamageNewsClick, mapReady]);

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
              zoom: 6.5,
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
