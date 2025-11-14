'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { geoServerConfig, getWMSTileUrl } from '../config/geoserver.config';
import MapControls from './MapControls';
import ZoomControls from './ZoomControls';
import WindLegend from './WindLegend';
import WindLayer from './WindLayer';
import MapInfo from './MapInfo';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type MapProps = {
  onMapReady?: (flyToLocation: (lng: number, lat: number, zoom?: number, imageUrl?: string) => void) => void;
};

export default function Map({ onMapReady }: MapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapState, setMapState] = useState({
    lat: 21.0278,
    lng: 105.8342,
    zoom: 6,
  });

  // Wind layer state
  const [windLayerEnabled, setWindLayerEnabled] = useState(true); // Bật mặc định
  const [windOpacity, setWindOpacity] = useState(0.7);
  const [windForecastHour, setWindForecastHour] = useState(0);
  const [windLoading, setWindLoading] = useState(false);
  const [windData, setWindData] = useState<any>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    // Bỏ giới hạn bounds để hiển thị toàn cầu
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      // Sử dụng style đơn giản từ Mapbox
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [105.8342, 21.0278],
      zoom: 6,
      minZoom: 2,
      maxZoom: 12,
      // maxBounds: undefined, // Cho phép xem toàn cầu
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
    const flyToLocation = (lng: number, lat: number, zoom: number = 10, imageUrl?: string) => {
      if (!map.current) return;

      // Remove old marker if exists
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }

      // Fly to location
      map.current.flyTo({
        center: [lng, lat],
        zoom: zoom,
        duration: 2000,
      });

      // Add custom marker with image if provided
      if (imageUrl) {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.backgroundImage = `url(${imageUrl})`;
        el.style.width = '60px';
        el.style.height = '60px';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.borderRadius = '12px';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
        el.style.cursor = 'pointer';
        el.style.transition = 'transform 0.2s';

        // Add hover effect
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.1)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        // Create and add marker
        const newMarker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current);

        marker.current = newMarker;
      }
    };

    newMap.on('load', () => {
      // Tùy chỉnh màu sắc để giống Windy (check if layer exists first)
      if (newMap.getLayer('background')) {
        newMap.setPaintProperty('background', 'background-color', '#0a1929');
      }

      // Call onMapReady callback with flyToLocation function
      onMapReady?.(flyToLocation);
      
      // Thêm layer đường biên quốc gia (tạm thời tắt để debug)
      // newMap.addSource('admin-source', {
      //   type: 'vector',
      //   url: 'mapbox://mapbox.country-boundaries-v1',
      // });

      // newMap.addLayer({
      //   id: 'country-boundaries',
      //   type: 'line',
      //   source: 'admin-source',
      //   'source-layer': 'country_boundaries',
      //   paint: {
      //     'line-color': '#5a6f7f',
      //     'line-width': 1,
      //     'line-opacity': 0.5,
      //   },
      // });

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

    // Cleanup
    return () => {
      if (marker.current) {
        marker.current.remove();
      }
      newMap.remove();
    };
  }, []);

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

      {/* Wind Layer with Plotty */}
      <WindLayer
        map={map.current}
        enabled={windLayerEnabled}
        opacity={windOpacity}
        forecastHour={windForecastHour}
        onLoadingChange={setWindLoading}
        onDataLoaded={setWindData}
      />

      {/* Map Controls - Search only */}
      <MapControls />

      {/* Zoom Controls - Zoom buttons and Location */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocationClick={handleLocationClick}
      />

      {/* Wind Legend with Controls (if wind layer is enabled) */}
      {windLayerEnabled && (
        <WindLegend
          opacity={windOpacity}
          forecastHour={windForecastHour}
          isLoading={windLoading}
          onOpacityChange={setWindOpacity}
          onForecastHourChange={setWindForecastHour}
          onWindAnimationToggle={handleWindAnimationToggle}
        />
      )}

      {/* Map Info - Coordinates and Zoom level */}
      <MapInfo lat={mapState.lat} lng={mapState.lng} zoom={mapState.zoom} />
    </div>
  );
}
