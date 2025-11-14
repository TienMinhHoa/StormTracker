'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { geoServerConfig, getWMSTileUrl } from '../config/geoserver.config';
import MapControls from './MapControls';
import ZoomControls from './ZoomControls';
import WindLegend from './WindLegend';
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

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    const bounds: [[number, number], [number, number]] = [
      [0.0, 0.0],
      [150.0, 30.0],
    ];

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      // Sử dụng style đơn giản từ Mapbox
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [105.8342, 21.0278],
      zoom: 6,
      minZoom: 2,
      maxZoom: 12,
      maxBounds: bounds,
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
      // Tùy chỉnh màu sắc để giống Windy
      newMap.setPaintProperty('background', 'background-color', '#0a1929');

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

      // ===== THÊM LAYER GIÓ TỪ GEOSERVER =====
      console.log('🔍 GeoServer config:', {
        enabled: geoServerConfig.enabled,
        url: geoServerConfig.url,
        workspace: geoServerConfig.workspace,
        windLayer: geoServerConfig.windLayer
      });

      // Chỉ thêm layer gió nếu enabled trong config
      if (geoServerConfig.enabled) {
        try {
          const windLayerName = `${geoServerConfig.workspace}:${geoServerConfig.windLayer}`;
          const tileUrl = getWMSTileUrl(windLayerName);

          console.log('🌐 Wind tile URL:', tileUrl);

          newMap.addSource('wind-source', {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: geoServerConfig.wms.tileSize,
          });

          // newMap.addLayer({
          //   id: 'wind-layer',
          //   type: 'raster',
          //   source: 'wind-source',
          //   paint: {
          //     'raster-opacity': geoServerConfig.display.opacity,
          //     'raster-fade-duration': geoServerConfig.display.fadeDuration,
          //   },
          // });

          console.log('✅ Map loaded with wind layer from GeoServer');
        } catch (error) {
          console.error('❌ Error loading wind layer:', error);
          console.log('💡 Tip: Set NEXT_PUBLIC_GEOSERVER_ENABLED=false to disable wind layer');
        }
      } else {
        console.log('ℹ️ Wind layer disabled');
      }
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

    newMap.on('dragend', () => {
      const center = newMap?.getCenter?.();
      const mapBounds = newMap?.getBounds?.();

      if (center && mapBounds && !mapBounds.contains(center)) {
        newMap.fitBounds(bounds, { padding: 0 });
      }
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

  const handleLayerToggle = useCallback((layer: string, enabled: boolean) => {
    console.log(`Layer ${layer} toggled:`, enabled);
    // Implement layer toggle logic here based on your needs
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0a1929]">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map Controls - Search and Layers */}
      <MapControls onLayerToggle={handleLayerToggle} />
      
      {/* Zoom Controls - Zoom buttons and Location */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocationClick={handleLocationClick}
      />
      
      {/* Wind Legend (if enabled) */}
      {geoServerConfig.enabled && <WindLegend />}
      
      {/* Map Info - Coordinates and Zoom level */}
      <MapInfo lat={mapState.lat} lng={mapState.lng} zoom={mapState.zoom} />
    </div>
  );
}
