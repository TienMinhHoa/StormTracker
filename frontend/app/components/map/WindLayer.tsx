'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { fetchGFSWindData, WindData } from './services/gfsService';
import { loadWindDataForTimestamp, AVAILABLE_TIMESTAMPS, WindTimestamp, TIFFWindData } from './services/tiffService';
import { renderWindyStyle } from './utils/windyColorScale';
import { WebGLWindRenderer } from './webgl';

interface WindLayerProps {
  map: mapboxgl.Map | null;
  enabled?: boolean;
  opacity?: number;
  timestamp?: string; // Timestamp format: "YYYY-MM-DD HH:MM"
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
  timestamp,
  onLoadingChange,
  onDataLoaded
}: WindLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webglRendererRef = useRef<WebGLWindRenderer | null>(null);
  const loadHandlerRef = useRef<(() => void) | null>(null);
  const styleLoadHandlerRef = useRef<(() => void) | null>(null);
  const [windData, setWindData] = useState<WindData | null>(null);
  const [windData_t1, setWindData_t1] = useState<TIFFWindData | null>(null);
  const [windData_t2, setWindData_t2] = useState<TIFFWindData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [layerReady, setLayerReady] = useState(false);
  const [useWebGL, setUseWebGL] = useState(true); // Enable WebGL by default

  // Initialize WebGL renderer
  useEffect(() => {
    if (!canvasRef.current || !useWebGL) return;
    
    try {
      webglRendererRef.current = new WebGLWindRenderer({
        canvas: canvasRef.current,
        speedRange: [0, 30],
        opacity: opacity
      });
      console.log('✅ WebGL renderer initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WebGL renderer, falling back to canvas:', error);
      setUseWebGL(false);
    }
    
    return () => {
      if (webglRendererRef.current) {
        webglRendererRef.current.destroy();
        webglRendererRef.current = null;
      }
    };
  }, [canvasRef.current, useWebGL]);

  // Fetch dữ liệu wind theo timestamp
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
        // Use provided timestamp or get current one
        const targetTimestamp = timestamp || AVAILABLE_TIMESTAMPS[0]?.timestamp;
        if (!targetTimestamp) {
          throw new Error('No timestamp available');
        }

        console.log(`🌪️ Loading wind data for timestamp: ${targetTimestamp}`);

        // Try to load from GFS_process first, fallback to GFS service
        let data: WindData;
        let tiffData: TIFFWindData | null = null;
        
        try {
          tiffData = await loadWindDataForTimestamp(targetTimestamp);
          
          // Check if data is valid
          if (!tiffData || tiffData.width === 0 || tiffData.height === 0) {
            throw new Error('Invalid or empty TIFF data');
          }
          
          // Convert TIFFWindData to WindData format for legacy rendering
          data = {
            u: new Float32Array(tiffData.u),
            v: new Float32Array(tiffData.v),
            speed: new Float32Array(tiffData.speed),
            width: tiffData.width,
            height: tiffData.height,
            bbox: tiffData.bbox
          };
          
          // Load into WebGL renderer (t1 = current)
          if (useWebGL && webglRendererRef.current && tiffData) {
            webglRendererRef.current.loadWindData_t1(tiffData);
            setWindData_t1(tiffData);
            
            // Try to preload next timestamp for smooth transitions
            const currentIndex = AVAILABLE_TIMESTAMPS.findIndex(t => t.timestamp === targetTimestamp);
            if (currentIndex >= 0 && currentIndex < AVAILABLE_TIMESTAMPS.length - 1) {
              const nextTimestamp = AVAILABLE_TIMESTAMPS[currentIndex + 1].timestamp;
              try {
                const nextTiffData = await loadWindDataForTimestamp(nextTimestamp);
                webglRendererRef.current.loadWindData_t2(nextTiffData);
                setWindData_t2(nextTiffData);
                console.log(`✅ Preloaded next timestamp: ${nextTimestamp}`);
              } catch (preloadError) {
                console.warn('⚠️ Failed to preload next timestamp:', preloadError);
              }
            }
          }
          
          console.log(`✅ Loaded TIFF wind data for ${targetTimestamp}`);
        } catch (tiffError) {
          console.warn('❌ TIFF loading failed, falling back to GFS service:', tiffError);
          // Fallback to original GFS service
          data = await fetchGFSWindData(0); // Use hour 0 as fallback
          console.log(`✅ Loaded GFS fallback wind data`);
        }

        setWindData(data);
        onDataLoaded?.(data);
      } catch (error) {
        console.error('Failed to load wind data:', error);
        setLayerReady(false);
      } finally {
        setIsLoading(false);
        onLoadingChange?.(false);
      }
    };

    loadWindData();
  }, [enabled, timestamp, onLoadingChange, onDataLoaded, useWebGL]);

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

    let dataUrl: string;
    
    // Use WebGL renderer if available (30-60x faster!)
    if (useWebGL && webglRendererRef.current) {
      console.log('⚡ Rendering with WebGL (hardware-accelerated)...');
      webglRendererRef.current.setOpacity(opacity);
      webglRendererRef.current.render();
      dataUrl = webglRendererRef.current.toDataURL();
      console.log('✅ WebGL rendering complete');
    } else {
      // Fallback to canvas rendering (legacy)
      console.log('🖼️ Rendering with Canvas (legacy)...');
      renderWindyStyle(canvas, speed, width, height, [0, 30]);
      dataUrl = canvas.toDataURL();
      console.log('✅ Canvas rendering complete');
    }

    console.log('📊 Data URL length:', dataUrl.length);

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
      // Clear any existing listeners
      if (loadHandlerRef.current) {
        loadHandlerRef.current = null;
      }
      if (styleLoadHandlerRef.current) {
        styleLoadHandlerRef.current = null;
      }

      // Check if map style is loaded
      if (map.isStyleLoaded()) {
        console.log('✅ Map style loaded, adding layer immediately');
        addLayerToMapInternal();
      } else {
        // Wait for style to load
        console.log('⏳ Waiting for map style to load...');

        const onStyleReady = () => {
          console.log('✅ Map style ready, adding layer now');
          styleLoadHandlerRef.current = null;
          addLayerToMapInternal();
        };

        styleLoadHandlerRef.current = onStyleReady;
        map.once('style.load', onStyleReady);

        // Fallback timeout
        setTimeout(() => {
          if (styleLoadHandlerRef.current) {
            console.log('⏰ Style load timeout, checking if ready...');
            styleLoadHandlerRef.current = null;
            if (map.isStyleLoaded()) {
              addLayerToMapInternal();
            }
          }
        }, 3000);
      }
    };

    const addLayerToMapInternal = () => {
      // Cập nhật hoặc tạo layer - Strategy: Đè lớp mới lên, GIỮ layer mới, xóa layer cũ
      console.log('🗺️ Adding/updating map layer...');

      if (map.getSource('wind-layer')) {
        // Prefer in-place update of the Image source to avoid reloading the style
        try {
          const source = map.getSource('wind-layer') as mapboxgl.ImageSource;
          // Update image URL + coordinates in-place. This should avoid flicker.
          source.updateImage({ url: dataUrl, coordinates });

          // Ensure the raster layer exists and set opacity
          if (!map.getLayer('wind-raster-layer')) {
            map.addLayer({
              id: 'wind-raster-layer',
              type: 'raster',
              source: 'wind-layer',
              paint: {
                'raster-opacity': opacity,
                'raster-fade-duration': 0
              }
            }, 'wind-country-boundaries');
          } else {
            try {
              map.setPaintProperty('wind-raster-layer', 'raster-opacity', opacity);
            } catch (err) {
              // ignore paint property error
            }
          }

          console.log('✅ Updated existing wind-layer image in-place (no recreate)');
          setLayerReady(true);
        } catch (err) {
          console.warn('⚠️ Failed to update image source in-place, falling back to recreate:', err);
          // Fallback: remove and recreate the source/layer (keeps old behavior as safety)
          try {
            if (map.getLayer('wind-raster-layer')) {
              map.removeLayer('wind-raster-layer');
            }
            if (map.getSource('wind-layer')) {
              map.removeSource('wind-layer');
            }

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
                'raster-fade-duration': 0
              }
            }, 'wind-country-boundaries');

            console.log('✅ Recreated wind layer as fallback');
            setLayerReady(true);
          } catch (recreateErr) {
            console.error('❌ Error recreating wind layer as fallback:', recreateErr);
            setLayerReady(false);
          }
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
              'raster-fade-duration': 0
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

    // Cleanup function - CHỈ cleanup event listeners, KHÔNG xóa layer
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

      // KHÔNG xóa layer ở đây - để layer cũ hiển thị cho đến khi có layer mới
      // Layer sẽ được update trong addLayerToMapInternal()
    };
  }, [map, enabled, windData]); // Không phụ thuộc vào opacity để tránh re-render không cần thiết
  
  // Cleanup khi component unmount hoàn toàn
  useEffect(() => {
    return () => {
      if (!map) return;
      
      // Chỉ xóa layer khi component unmount
      try {
        if (map.getLayer('wind-raster-layer')) {
          map.removeLayer('wind-raster-layer');
        }
        if (map.getSource('wind-layer')) {
          map.removeSource('wind-layer');
        }
        if (map.getLayer('wind-raster-layer-new')) {
          map.removeLayer('wind-raster-layer-new');
        }
        if (map.getSource('wind-layer-new')) {
          map.removeSource('wind-layer-new');
        }
      } catch (error) {
        // Ignore errors during cleanup
      }
    };
  }, [map]);

  // Update opacity khi thay đổi
  useEffect(() => {
    if (!map || !enabled || !layerReady) return;

    // Update WebGL renderer opacity (no re-render needed, just shader uniform update)
    if (useWebGL && webglRendererRef.current) {
      webglRendererRef.current.setOpacity(opacity);
      webglRendererRef.current.render();
      
      // Update Mapbox layer with new rendering
      const dataUrl = webglRendererRef.current.toDataURL();
      if (map.getSource('wind-layer')) {
        try {
          const source = map.getSource('wind-layer') as mapboxgl.ImageSource;
          const coords = source.coordinates;
          if (coords) {
            source.updateImage({ url: dataUrl, coordinates: coords });
            console.log(`⚡ Updated WebGL wind layer opacity to ${opacity}`);
          }
        } catch (error) {
          console.error('❌ Error updating WebGL opacity:', error);
        }
      }
    } else {
      // Legacy canvas rendering - update map layer opacity
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
    }
  }, [map, enabled, opacity, layerReady, useWebGL]);

  return (
    <canvas
      ref={canvasRef}
      width={1440} // Full resolution GFS 0.25°
      height={681} // 170° / 0.25° + 1 (từ -85° đến 85°)
      style={{ display: 'none' }}
    />
  );
}
