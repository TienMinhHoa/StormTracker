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
import IslandsLayer from './IslandsLayer';
import MapInfo from './MapInfo';
import { RescueRequest } from '../rescue';
import { AVAILABLE_TIMESTAMPS, getCurrentTimestamp, initializeTimestamps, getTimestampsForStorm } from './services/tiffService';
import { getStormTracks, type Storm, type StormTrack } from '../../services/stormApi';
import { getSafeImageUrl, DEFAULT_NEWS_IMAGE } from '../../utils/imageUtils';
import type { DamageDetailRecord } from '../../services/damageDetailsApi';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type MapProps = {
  onMapReady?: (flyToLocation: (lng: number, lat: number, zoom?: number) => void) => void;
  rescueRequests?: RescueRequest[];
  newsItems?: Array<{ id: number; coordinates: [number, number]; title: string; image: string; category: string }>;
  activeTab?: 'forecast' | 'rescue' | 'damage' | 'chatbot';
  onNewsClick?: (news: any) => void;
  selectedStorm?: Storm | null;
  stormFilter?: 'history' | 'live';
  showNewsMarkers?: boolean;
  showRescueMarkers?: boolean;
  showWarningMarkers?: boolean;
  showDamageMarkers?: boolean;
  damageDetailsItems?: DamageDetailRecord[];
  rescueNewsItems?: Array<{
    news_id: number;
    title: string;
    content: string;
    lat: number;
    lon: number;
    published_at: string;
    thumbnail_url: string;
    source_url: string;
  }>;
  showRescueNewsMarkers?: boolean;
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
  onRescueRequestUpdate?: (requestId: number, status: 'pending' | 'in-progress' | 'completed') => Promise<void>;
};

export default function Map({ onMapReady, rescueRequests = [], newsItems = [], activeTab = 'forecast', onNewsClick, selectedStorm, stormFilter = 'history', showNewsMarkers = true, showRescueMarkers = true, showWarningMarkers = true, showDamageMarkers = true, damageDetailsItems = [], rescueNewsItems = [], showRescueNewsMarkers = true, warningItems = [], onWarningClick, onRescueRequestUpdate }: MapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const rescueMarkers = useRef<mapboxgl.Marker[]>([]);
  const newsMarkers = useRef<mapboxgl.Marker[]>([]);
  const warningMarkers = useRef<mapboxgl.Marker[]>([]);
  const damageDetailMarkers = useRef<mapboxgl.Marker[]>([]);
  const rescueNewsMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapState, setMapState] = useState({
    lat: 21.0278,
    lng: 105.8342,
    zoom: 6,
  });

  // Wind layer state
  const [windEnabled, setWindEnabled] = useState(true); // Toggle to show/hide wind layer
  const windOpacity = 0.90; // Fixed opacity at 1.0
  const [windTimestamp, setWindTimestamp] = useState<string>('');
  const [windLoading, setWindLoading] = useState(false);
  const [windData, setWindData] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Wind animation state - controlled by toggle
  const [windAnimationEnabled, setWindAnimationEnabled] = useState(false);
  
  // Storm tracks state
  const [stormTracks, setStormTracks] = useState<StormTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  // Load timestamps based on selected storm
  useEffect(() => {
    const loadTimestampsForStorm = async () => {
      try {
        if (selectedStorm?.start_date) {
          console.log(`🌀 Loading timestamps for storm: ${selectedStorm.name}`);
          console.log(`   Start: ${selectedStorm.start_date}`);
          console.log(`   End: ${selectedStorm.end_date || 'ongoing'}`);
          
          // Load timestamps trong khoảng thời gian của bão
          const stormTimestamps = await getTimestampsForStorm(
            selectedStorm.start_date,
            selectedStorm.end_date || null
          );
          
          if (stormTimestamps.length > 0) {
            // Set timestamp đầu tiên của bão
            setWindTimestamp(stormTimestamps[0].timestamp);
            console.log(`✅ Loaded ${stormTimestamps.length} timestamps for storm`);
            console.log(`   First timestamp: ${stormTimestamps[0].timestamp}`);
          } else {
            console.warn('⚠️ No wind data available for this storm period');
            setWindTimestamp('');
            setWindData(null);
          }
        } else {
          // Không có storm được chọn, load timestamps hiện tại
          await initializeTimestamps();
          const currentTimestamp = await getCurrentTimestamp();
          setWindTimestamp(currentTimestamp);
          console.log(`🕐 No storm selected, using current timestamp: ${currentTimestamp}`);
        }
      } catch (error) {
        console.error('Failed to load timestamps for storm:', error);
        // Fallback
        if (AVAILABLE_TIMESTAMPS.length > 0) {
          setWindTimestamp(AVAILABLE_TIMESTAMPS[0].timestamp);
        }
      }
    };
    
    loadTimestampsForStorm();
  }, [selectedStorm?.storm_id, selectedStorm?.start_date, selectedStorm?.end_date]);

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
      // Sử dụng light style - sáng hơn, dễ nhìn
      style: 'mapbox://styles/mapbox/light-v11',
      center: [105.8342, 21.0278],
      zoom: 6,
      minZoom: 2,
      maxZoom: 12,
      // Không giới hạn khu vực - cho phép xem toàn cầu
      // maxBounds: undefined,
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

    // Only create markers if showNewsMarkers is enabled
    if (!showNewsMarkers) return;

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

      // Map urgency to color
      const getUrgencyColor = (urgency: 'critical' | 'high' | 'medium' | 'low'): string => {
        switch (urgency) {
          case 'critical': return '#ef4444'; // Red
          case 'high': return '#f97316'; // Orange
          case 'medium': return '#eab308'; // Yellow
          case 'low': return '#22c55e'; // Green
          default: return '#eab308';
        }
      };

      // Get marker color: green if completed, otherwise based on urgency
      const markerColor = rescue.status === 'completed' 
        ? '#22c55e' 
        : getUrgencyColor(rescue.urgency);
      
      const urgencyColor = getUrgencyColor(rescue.urgency);

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

      // Add pulsing animation for critical/high urgency (only if not completed)
      if ((rescue.urgency === 'critical' || rescue.urgency === 'high') && 
          rescue.status !== 'completed') {
        el.style.animation = 'pulse 2s infinite';
      }

      // Create popup with rescue info and action buttons
      const statusLabel = rescue.status === 'pending' ? 'Đang tiếp nhận' :
                         rescue.status === 'completed' ? 'Đã hỗ trợ' : 'Đang cứu hộ';
      
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
        <p style="margin: 4px 0; font-size: 13px;"><strong>Mức độ khẩn cấp:</strong> ${urgencyLabel}</p>
        <p style="margin: 6px 0 4px 0; font-size: 12px; color: #666;">${rescue.description}</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">${rescue.timestamp}</p>
        ${rescue.status !== 'completed' ? `
          <div style="margin-top: 8px; display: flex; gap: 4px;">
            <button id="btn-inprogress-${rescue.id}" style="flex: 1; padding: 6px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">
              → Đang xử lý
            </button>
            <button id="btn-completed-${rescue.id}" style="flex: 1; padding: 6px; background: #22c55e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;">
              ✓ Đã hỗ trợ
            </button>
          </div>
        ` : ''}
      `;

      popup.setDOMContent(popupContent);

      // Add event listeners for buttons after popup is set
      if (rescue.status !== 'completed' && onRescueRequestUpdate) {
        // Use a closure to capture the rescue id and update function
        const rescueId = rescue.id;
        const updateHandler = onRescueRequestUpdate;
        
        // Wait for popup to be added to DOM
        setTimeout(() => {
          const inProgressBtn = popupContent.querySelector(`#btn-inprogress-${rescueId}`) as HTMLButtonElement;
          const completedBtn = popupContent.querySelector(`#btn-completed-${rescueId}`) as HTMLButtonElement;
          
          if (inProgressBtn) {
            inProgressBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                await updateHandler(rescueId, 'in-progress');
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
      // Urgency priority mapping
      const urgencyPriority = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4 };
      
      const highestPriorityRequest = rescueRequests.reduce((max, request) => {
        const maxPeople = max.numberOfPeople || 0;
        const currentPeople = request.numberOfPeople || 0;
        // Prioritize by number of people, then by urgency (lower number = higher urgency)
        if (currentPeople > maxPeople) return request;
        if (currentPeople === maxPeople && urgencyPriority[request.urgency] < urgencyPriority[max.urgency]) return request;
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
      const { id, lon, lat, commune_name, district_name, provinceName, nguycosatlo, nguycoluquet, luongmuatd_db } = warning;
      const uniqueKey = `${id}-${commune_name}-${district_name}`;

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

  // Rescue news markers effect
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing rescue news markers
    rescueNewsMarkers.current.forEach(marker => marker.remove());
    rescueNewsMarkers.current = [];

    // Only show rescue news markers when rescue tab is active and toggle is on
    if (activeTab !== 'rescue' || !showRescueNewsMarkers || rescueNewsItems.length === 0) return;

    console.log(`📰 Adding ${rescueNewsItems.length} rescue news markers to map`);

    rescueNewsItems.forEach((news) => {
      if (!news.lat || !news.lon) return;

      // Create marker element - blue icon for rescue news
      const el = document.createElement('div');
      el.className = 'rescue-news-marker';
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#2563eb';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.4)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.color = 'white';
      el.style.fontSize = '18px';
      el.innerHTML = '📰';

      // Create popup with news preview
      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: true,
        className: 'rescue-news-popup',
        maxWidth: '320px'
      }).setHTML(`
        <div style="padding: 14px; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); border-radius: 8px;">
          ${news.thumbnail_url ? `
            <img src="${news.thumbnail_url}" 
                 style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" 
                 alt="Ảnh tin tức"
                 onerror="this.src='https://cdnphoto.dantri.com.vn/V0A7pXa4T8wsbhHMmWmZti84Kkk=/2025/11/07/da-nang-1762483851451.jpg'" />
          ` : ''}
          <div style="background: rgba(37, 99, 235, 0.2); padding: 10px; border-radius: 6px; border-left: 3px solid #2563eb; margin-bottom: 10px;">
            <h3 style="margin: 0; font-weight: bold; color: #93c5fd; font-size: 15px; line-height: 1.4;">
              📰 ${news.title}
            </h3>
          </div>
          <div style="background: rgba(30, 58, 138, 0.3); padding: 10px; border-radius: 6px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 13px; color: #dbeafe; line-height: 1.6;">
              ${news.content.length > 150 ? news.content.substring(0, 150) + '...' : news.content}
            </p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid rgba(59, 130, 246, 0.3);">
            <span style="font-size: 11px; color: #bfdbfe;">
              📅 ${new Date(news.published_at).toLocaleDateString('vi-VN', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            ${news.source_url ? `
              <a href="${news.source_url}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="color: #60a5fa; font-size: 11px; text-decoration: none; font-weight: 600;">
                🔗 Nguồn tin
              </a>
            ` : ''}
          </div>
        </div>
      `);

      // Click handler - zoom to news location
      el.addEventListener('click', () => {
        if (map.current) {
          map.current.flyTo({
            center: [news.lon, news.lat],
            zoom: 6.5,
            duration: 2000,
          });
        }
      });

      // Create and add marker
      const rescueNewsMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([news.lon, news.lat])
        .setPopup(popup)
        .addTo(map.current!);

      rescueNewsMarkers.current.push(rescueNewsMarker);
    });
  }, [rescueNewsItems, activeTab, showRescueNewsMarkers, mapReady]);

  // Damage news markers effect
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing damage news markers
    damageDetailMarkers.current.forEach(marker => marker.remove());
    damageDetailMarkers.current = [];

    // Only show damage detail markers when damage tab is active and toggle is on
    if (activeTab !== 'damage' || !showDamageMarkers || damageDetailsItems.length === 0) return;

    console.log(`📍 Adding ${damageDetailsItems.length} damage detail location markers to map`);

    damageDetailsItems.forEach((detail) => {
      const { latitude, longitude, location_name, damages } = detail.content;
      if (!latitude || !longitude) return;

      // Determine marker color based on damage types
      const hasCasualties = damages.casualties;
      const hasEconomic = damages.economic;
      const markerColor = hasCasualties ? '#dc2626' : hasEconomic ? '#9333ea' : '#ef4444';
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'damage-detail-marker';
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = markerColor;
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.color = 'white';
      el.style.fontSize = '18px';
      el.innerHTML = '📍';

      // Build damage categories HTML
      const damageCategories = Object.entries(damages).map(([category, description]) => {
        const icons: Record<string, string> = {
          flooding: '🌊', wind_damage: '💨', infrastructure: '🏗️',
          agriculture: '🌾', casualties: '💀', evacuated: '🚶', economic: '💰'
        };
        const icon = icons[category] || '📌';
        return `
          <div style="background: rgba(55, 65, 81, 0.5); padding: 8px; border-radius: 6px; margin-bottom: 8px;">
            <div style="color: #fbbf24; font-weight: 600; font-size: 12px; margin-bottom: 4px;">
              ${icon} ${category.replace(/_/g, ' ').toUpperCase()}
            </div>
            <div style="color: #d1d5db; font-size: 12px; line-height: 1.4;">
              ${description}
            </div>
          </div>
        `;
      }).join('');

      // Create popup with damage details
      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: true,
        className: 'damage-detail-popup',
        maxWidth: '350px'
      }).setHTML(`
        <div style="padding: 14px; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); border-radius: 8px;">
          <div style="background: rgba(239, 68, 68, 0.15); padding: 10px; border-radius: 6px; border-left: 4px solid ${markerColor}; margin-bottom: 12px;">
            <h3 style="margin: 0; font-weight: bold; color: #fff; font-size: 16px;">
              📍 ${location_name}
            </h3>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #9ca3af;">
              ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°
            </p>
          </div>
          ${damageCategories}
          <div style="padding-top: 8px; border-top: 1px solid rgba(75, 85, 99, 0.5); margin-top: 8px;">
            <span style="font-size: 10px; color: #9ca3af;">
              ID: ${detail.id} • Storm: ${detail.storm_id}
            </span>
          </div>
        </div>
      `);

      // Click handler
      el.addEventListener('click', () => {
        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 8,
            duration: 2000,
          });
        }
      });

      // Create and add marker
      const damageMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map.current!);

      damageDetailMarkers.current.push(damageMarker);
    });
  }, [damageDetailsItems, activeTab, showDamageMarkers, mapReady]);

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

  // Debug log
  console.log('🔍 Map render - stormFilter:', stormFilter, 'windTimestamp:', windTimestamp);

  return (
    <div className="relative w-full h-full bg-[#e8eef2]">
      <div ref={mapContainer} className="w-full h-full relative z-20" />

      {/* Wind Layer - only enabled in Live mode and when wind toggle is on */}
      {stormFilter === 'live' && windEnabled && (
        <WindLayer
          map={map.current}
          enabled={true}
          opacity={windOpacity}
          timestamp={windTimestamp}
          onLoadingChange={setWindLoading}
          onDataLoaded={setWindData}
        />
      )}

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

      {/* Islands layer: Hoàng Sa & Trường Sa */}
      {mapReady && (
        <IslandsLayer
          map={map.current}
          enabled={true}
        />
      )}

      {/* Wind Toggle - Top Right Corner */}
      {stormFilter === 'live' && (
        <div className="absolute top-4 right-4 z-30 pointer-events-auto">
          <label className="flex items-center gap-2 px-3 py-2 bg-[#1a2332]/90 backdrop-blur-sm rounded-lg hover:bg-[#1a2332] cursor-pointer border border-white/10 shadow-lg">
            <input
              type="checkbox"
              checked={windEnabled}
              onChange={(e) => setWindEnabled(e.target.checked)}
              className="rounded bg-transparent border-white/50 text-[#137fec] focus:ring-[#137fec] focus:ring-offset-0 w-4 h-4"
            />
            <span className="text-sm font-semibold text-white">Hiển thị gió</span>
          </label>
        </div>
      )}

      {/* Time Navigation - Bottom Center (Live mode only) */}
      {stormFilter === 'live' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <div className="bg-[#0a1929]/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-2xl border border-white/10">
            <TimeControls
              currentTimestamp={windTimestamp}
              onTimestampChange={setWindTimestamp}
              selectedStorm={selectedStorm}
            />
          </div>
        </div>
      )}

      {/* Debug Info - Remove this later */}
      <div className="absolute top-20 right-4 z-50 bg-red-500/90 text-white px-3 py-2 rounded text-xs">
        StormFilter: {stormFilter}
      </div>

      {/* Wind Legend - Bottom Right (Live mode only) */}
      {stormFilter === 'live' && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
          <WindLegend
            opacity={windOpacity}
            timestamp={windTimestamp}
            isLoading={windLoading}
            onWindAnimationToggle={handleWindAnimationToggle}
          />
        </div>
      )}

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
