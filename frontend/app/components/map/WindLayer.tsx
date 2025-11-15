'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { fetchGFSWindData, WindData } from './services/gfsService';
import { renderWindyStyle } from './utils/windyColorScale';

interface WindLayerProps {
  map: mapboxgl.Map | null;
  enabled?: boolean;
  opacity?: number;
  forecastHour?: number; // Giờ dự báo (0 = hiện tại, 3 = +3h, etc.)
  onLoadingChange?: (loading: boolean) => void;
  onDataLoaded?: (data: WindData) => void;
}

// Function để thêm boundaries overlay lên trên wind layer
function addBoundariesOverlay(map: mapboxgl.Map) {
  try {
    // Kiểm tra nếu đã có boundaries rồi thì bỏ qua
    if (map.getLayer('wind-country-boundaries')) {
      console.log('🔄 Boundaries already exist, skipping...');
      return;
    }

    // Thêm source nếu chưa có
    if (!map.getSource('wind-admin-boundaries')) {
      map.addSource('wind-admin-boundaries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
      });
    }

    // Thêm ranh giới quốc gia - chỉ lines, không fill
    map.addLayer({
      id: 'wind-country-boundaries',
      type: 'line',
      source: 'wind-admin-boundaries',
      'source-layer': 'country_boundaries',
      paint: {
        'line-color': '#000000', // Đen
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          2, 0.3,    // Zoom nhỏ: rất mỏng
          6, 0.6,    // Zoom trung bình: mỏng
          10, 0.9,   // Zoom lớn: vừa
          12, 1.2    // Zoom max: dày vừa
        ],
        'line-opacity': 0.9, // Rõ hơn trên màu gió
      },
      minzoom: 2,
    }); // Không chỉ định beforeId - sẽ ở trên cùng

    // Source chỉ có country_boundaries, không có maritime_boundaries
    // Boundaries chỉ cần country boundaries là đủ

    console.log('✅ Boundaries overlay added on top of wind layer');

  } catch (error) {
    console.error('❌ Error adding boundaries overlay:', error);
  }
}

export default function WindLayer({
  map,
  enabled = true,
  opacity = 0.7,
  forecastHour = 0,
  onLoadingChange,
  onDataLoaded
}: WindLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadHandlerRef = useRef<(() => void) | null>(null);
  const styleLoadHandlerRef = useRef<(() => void) | null>(null);
  const [windData, setWindData] = useState<WindData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [layerReady, setLayerReady] = useState(false);

  // Fetch dữ liệu GFS
  useEffect(() => {
    if (!enabled) {
      setLayerReady(false);
      return;
    }

    const loadWindData = async () => {
      setIsLoading(true);
      setLayerReady(false); // Reset khi bắt đầu load
      onLoadingChange?.(true);

      try {
        const data = await fetchGFSWindData(forecastHour);
        setWindData(data);
        onDataLoaded?.(data);
        console.log(`🌪️ Loaded GFS wind data for +${forecastHour}h forecast`);
      } catch (error) {
        console.error('Failed to load wind data:', error);
        setLayerReady(false);
      } finally {
        setIsLoading(false);
        onLoadingChange?.(false);
      }
    };

    loadWindData();
  }, [enabled, forecastHour, onLoadingChange, onDataLoaded]);

  // Render layer khi có dữ liệu
  useEffect(() => {
    if (!map || !enabled || !windData || !canvasRef.current) {
      console.log('⏭️ Skipping wind layer render:', {
        hasMap: !!map,
        enabled,
        hasWindData: !!windData,
        hasCanvas: !!canvasRef.current
      });
      return;
    }

    console.log('🎨 Starting wind layer render...');
    const { speed, width, height, bbox } = windData;

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('❌ Canvas is null');
      return;
    }

    // Render với Windy.com color scale (custom rendering)
    console.log('🖼️ Rendering with Windy.com color scale...');
    renderWindyStyle(canvas, speed, width, height, [0, 30]);

    // Chuyển canvas thành data URL
    const dataUrl = canvas.toDataURL();
    console.log('📊 Canvas rendered, data URL length:', dataUrl.length);

    // Tính toán coordinates cho Mapbox (dựa trên bbox)
    const [west, south, east, north] = bbox;

    // Validate bbox values
    if (!isFinite(west) || !isFinite(south) || !isFinite(east) || !isFinite(north)) {
      console.error('❌ Invalid bbox values (NaN/Infinity):', bbox);
      throw new Error('Invalid bbox values from TIFF data');
    }

    if (west >= east || south >= north) {
      console.error('❌ Invalid bbox: west >= east or south >= north:', bbox);
      throw new Error('Invalid bbox: coordinates must satisfy west < east and south < north');
    }

    // Clamp to valid ranges for Mapbox
    const clampedWest = Math.max(-180, Math.min(180, west));
    const clampedSouth = Math.max(-85, Math.min(85, south));
    const clampedEast = Math.max(-180, Math.min(180, east));
    const clampedNorth = Math.max(-85, Math.min(85, north));

    const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
      [clampedWest, clampedNorth],   // Top-left
      [clampedEast, clampedNorth],   // Top-right
      [clampedEast, clampedSouth],   // Bottom-right
      [clampedWest, clampedSouth]    // Bottom-left
    ];

    console.log('📐 BBox (original):', bbox);
    console.log('📐 BBox (clamped):', [clampedWest, clampedSouth, clampedEast, clampedNorth]);
    console.log('📍 Coordinates:', coordinates);

    // Thêm layer vào map (map có thể đã load hoặc chưa)
    const addLayerToMap = () => {
      // Check nếu map đã load (cả style và data)
      if (map.loaded() && map.isStyleLoaded()) {
        // Map đã load, thêm layer ngay
        console.log('✅ Map already loaded, adding layer immediately');
        addLayerToMapInternal();
      } else {
        // Map chưa load, đợi event 'load' hoặc 'style.load'
        console.log('⏳ Map not loaded yet, waiting for load event...');

        // Try both 'load' and 'style.load' events
        const onMapReady = () => {
          console.log('✅ Map ready, adding layer now');
          // Clear refs
          loadHandlerRef.current = null;
          styleLoadHandlerRef.current = null;
          addLayerToMapInternal();
        };

        // Listen to both events (whichever fires first)
        if (map.isStyleLoaded()) {
          // Style loaded, just wait for data
          loadHandlerRef.current = onMapReady;
          map.once('load', onMapReady);
        } else {
          // Style not loaded, wait for style first
          const onStyleLoad = () => {
            loadHandlerRef.current = onMapReady;
            map.once('load', onMapReady);
          };
          styleLoadHandlerRef.current = onStyleLoad;
          map.once('style.load', onStyleLoad);
        }
      }
    };

    const addLayerToMapInternal = () => {
      // Cập nhật hoặc tạo layer
      console.log('🗺️ Adding/updating map layer...');

      if (map.getSource('wind-layer')) {
        console.log('🔄 Updating existing wind layer');
        try {
          (map.getSource('wind-layer') as mapboxgl.ImageSource).updateImage({ url: dataUrl, coordinates: coordinates });
          console.log(`✅ Wind layer updated with Windy.com color scale`);
          setLayerReady(true);
        } catch (error) {
          console.error('❌ Error updating wind layer:', error);
          setLayerReady(false);
        }
      } else {
        console.log('➕ Creating new wind layer');
        try {
          map.addSource('wind-layer', {
            type: 'image',
            url: dataUrl,
            coordinates: coordinates
          });

          map.addLayer({
            id: 'wind-raster-layer',
            type: 'raster',
            source: 'wind-layer',
            paint: {
              'raster-opacity': opacity,
              'raster-fade-duration': 300
            }
          });

          console.log('✅ Wind layer added to map');
          console.log(`✅ Wind layer rendered with Windy.com color scale`);

          // Thêm boundaries overlay lên trên wind layer
          addBoundariesOverlay(map);

          setLayerReady(true);
        } catch (error) {
          console.error('❌ Error adding wind layer:', error);
        }
      }
    };

    addLayerToMap();

    // Cleanup function
    return () => {
      // Remove event listeners nếu chưa fire
      if (loadHandlerRef.current) {
        map.off('load', loadHandlerRef.current);
        loadHandlerRef.current = null;
      }
      if (styleLoadHandlerRef.current) {
        map.off('style.load', styleLoadHandlerRef.current);
        styleLoadHandlerRef.current = null;
      }

      // Remove layer và source
      try {
        if (map.getLayer('wind-raster-layer')) {
          map.removeLayer('wind-raster-layer');
        }
        if (map.getSource('wind-layer')) {
          map.removeSource('wind-layer');
        }
      } catch (error) {
        // Ignore errors during cleanup
      }
    };
  }, [map, enabled, windData]); // Không phụ thuộc vào opacity để tránh re-render không cần thiết

  // Update opacity khi thay đổi (không re-render canvas)
  useEffect(() => {
    if (!map || !enabled || !layerReady) return;

    const layerId = 'wind-raster-layer';
    if (map.getLayer(layerId)) {
      try {
        map.setPaintProperty(layerId, 'raster-opacity', opacity);
        console.log(`🎨 Updated wind layer opacity to ${opacity}`);
      } catch (error) {
        console.error('❌ Error updating opacity:', error);
        setLayerReady(false);
      }
    } else {
      console.log('⏭️ Skipping opacity update - layer not found');
      setLayerReady(false);
    }
  }, [map, enabled, opacity, layerReady]);

  return (
    <canvas
      ref={canvasRef}
      width={1440} // Full resolution GFS 0.25°
      height={681} // 170° / 0.25° + 1 (từ -85° đến 85°)
      style={{ display: 'none' }}
    />
  );
}
