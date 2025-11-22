'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// Storm track point interface
export interface StormTrackPoint {
  track_id: number;
  storm_id: string;
  timestamp: string;
  lat: number;
  lon: number;
  category: number;
  wind_speed: number;
}

interface StormTrackLayerProps {
  map: mapboxgl.Map | null;
  enabled?: boolean;
  stormId?: string;
  tracks?: StormTrackPoint[]; // If provided, use API tracks; otherwise use mock data
}

// Mock data (Philippines typhoon) - Sync với wind data timeline (20-21/11/2025)
const MOCK_STORM_TRACKS: StormTrackPoint[] = [
  // Historical track (past)
  {
    track_id: 1,
    storm_id: "2025325N14120",
    timestamp: "2025-11-19T07:00:00",
    lat: 14.0,
    lon: 125.5,
    category: 4,
    wind_speed: 75
  },
  {
    track_id: 2,
    storm_id: "2025325N14120",
    timestamp: "2025-11-19T19:00:00",
    lat: 14.5,
    lon: 123.0,
    category: 5,
    wind_speed: 85
  },
  {
    track_id: 3,
    storm_id: "2025325N14120",
    timestamp: "2025-11-20T07:00:00",
    lat: 15.2,
    lon: 120.8,
    category: 4,
    wind_speed: 72
  },
  // Forecast track (future)
  {
    track_id: 4,
    storm_id: "2025325N14120",
    timestamp: "2025-11-20T19:00:00",
    lat: 15.8,
    lon: 119.2,
    category: 3,
    wind_speed: 65
  },
  {
    track_id: 5,
    storm_id: "2025325N14120",
    timestamp: "2025-11-21T07:00:00",
    lat: 16.2,
    lon: 118.5,
    category: 3,
    wind_speed: 62
  },
  {
    track_id: 6,
    storm_id: "2025325N14120",
    timestamp: "2025-11-22T07:00:00",
    lat: 16.8,
    lon: 117.5,
    category: 2,
    wind_speed: 55
  },
  {
    track_id: 7,
    storm_id: "2025325N14120",
    timestamp: "2025-11-23T07:00:00",
    lat: 17.5,
    lon: 116.2,
    category: 2,
    wind_speed: 48
  },
  {
    track_id: 8,
    storm_id: "2025325N14120",
    timestamp: "2025-11-24T07:00:00",
    lat: 18.2,
    lon: 115.0,
    category: 1,
    wind_speed: 40
  },
];

/**
 * Convert storm track points to GeoJSON LineString
 * Split into past (black) and forecast (grey) segments
 */
function createTrackLineGeometry(tracks: StormTrackPoint[], forecastStartIndex: number = 3) {
  const pastTracks = tracks.slice(0, forecastStartIndex);
  const forecastTracks = tracks.slice(forecastStartIndex - 1); // Include last past point for continuity
  
  return {
    past: {
      type: 'Feature',
      properties: { type: 'past' },
      geometry: {
        type: 'LineString',
        coordinates: pastTracks.map(t => [t.lon, t.lat])
      }
    },
    forecast: {
      type: 'Feature',
      properties: { type: 'forecast' },
      geometry: {
        type: 'LineString',
        coordinates: forecastTracks.map(t => [t.lon, t.lat])
      }
    }
  };
}

/**
 * Convert storm track points to GeoJSON FeatureCollection of Points
 */
function createTrackPointsGeometry(tracks: StormTrackPoint[]) {
  return {
    type: 'FeatureCollection',
    features: tracks.map((track, index) => ({
      type: 'Feature',
      properties: {
        track_id: track.track_id,
        storm_id: track.storm_id,
        timestamp: track.timestamp,
        category: track.category,
        wind_speed: track.wind_speed,
        is_latest: index === tracks.length - 1,
        // Format timestamp for display: "DD-HHh" (ví dụ: "20-15h" cho ngày 20, giờ 15:00)
        display_time: (() => {
          const date = new Date(track.timestamp);
          const day = date.getDate().toString().padStart(2, '0');
          const hour = date.getHours().toString().padStart(2, '0');
          return `${day}-${hour}h`;
        })(),
        is_forecast: index >= 3 // Points from index 3 onwards are forecast
      },
      geometry: {
        type: 'Point',
        coordinates: [track.lon, track.lat]
      }
    }))
  };
}

/**
 * Create forecast uncertainty cones (circles around each forecast point)
 */
function createForecastConesGeometry(tracks: StormTrackPoint[], forecastStartIndex: number = 3) {
  // Only create cones for forecast points (future)
  const forecastPoints = tracks.slice(forecastStartIndex);
  
  return {
    type: 'FeatureCollection',
    features: forecastPoints.map((track, index) => {
      // Radius increases with forecast time (uncertainty grows)
      // Base radius: 20km, increases by 10km per 12 hours (giảm đáng kể để nhỏ hơn)
      const hoursFromNow = (index + 1) * 12;
      const radiusKm = 20 + (hoursFromNow / 12) * 10;
      const radiusInDegrees = radiusKm / 111; // 1 degree ≈ 111 km
      
      return {
        type: 'Feature',
        properties: {
          track_id: track.track_id,
          radius: radiusInDegrees,
          is_forecast: true
        },
        geometry: {
          type: 'Point',
          coordinates: [track.lon, track.lat]
        }
      };
    })
  };
}

/**
 * Create overall forecast cone (green shaded polygon)
 */
function createOverallConeGeometry(tracks: StormTrackPoint[], forecastStartIndex: number = 3) {
  const forecastPoints = tracks.slice(forecastStartIndex);
  if (forecastPoints.length < 2) return null;
  
  // Create polygon by connecting outer edges of uncertainty circles
  const coordinates: [number, number][] = [];
  
  // Calculate outer edges for each forecast point
  forecastPoints.forEach((track, index) => {
    const hoursFromNow = (index + 1) * 12;
    const radiusKm = 20 + (hoursFromNow / 12) * 10;  // Giảm base radius và increment
    const radiusDegrees = radiusKm / 111;
    
    // Add points around the circle (8 points for smooth polygon)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      const lat = track.lat + radiusDegrees * Math.cos(angle);
      const lon = track.lon + radiusDegrees * Math.sin(angle) / Math.cos(track.lat * Math.PI / 180);
      coordinates.push([lon, lat]);
    }
  });
  
  // Close the polygon
  if (coordinates.length > 0) {
    coordinates.push(coordinates[0]);
  }
  
  return {
    type: 'Feature',
    properties: { type: 'overall_cone' },
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    }
  };
}

export default function StormTrackLayer({
  map,
  enabled = true,
  stormId,
  tracks = MOCK_STORM_TRACKS
}: StormTrackLayerProps) {
  const animationFrameRef = useRef<number | null>(null);
  const pulseStartTimeRef = useRef<number>(Date.now());
  const [layerReady, setLayerReady] = useState(false);

  // Add storm track layers to map
  useEffect(() => {
    console.log('🌪️ StormTrackLayer effect:', { 
      hasMap: !!map, 
      enabled, 
      tracksCount: tracks.length,
      isStyleLoaded: map?.isStyleLoaded() 
    });
    
    if (!map || !enabled || tracks.length === 0) {
      console.log('⏭️ Skipping storm track - conditions not met');
      return;
    }

    const addStormTrackLayers = () => {
      try {
        const pastLineSourceId = 'storm-track-past-line';
        const forecastLineSourceId = 'storm-track-forecast-line';
        const overallConeSourceId = 'storm-track-overall-cone';
        const pointsSourceId = 'storm-track-points';
        const conesSourceId = 'storm-track-cones';
        const pastLineLayerId = 'storm-track-past-line-layer';
        const forecastLineLayerId = 'storm-track-forecast-line-layer';
        const overallConeLayerId = 'storm-track-overall-cone-layer';
        const conesLayerId = 'storm-track-cones-layer';
        const pointsLayerId = 'storm-track-points-layer';
        const labelsLayerId = 'storm-track-labels-layer';

        console.log('🎨 Adding storm track layers...');

        // Check if map style is loaded
        if (!map.isStyleLoaded()) {
          console.log('⏳ Waiting for map style to load...');
          map.once('style.load', addStormTrackLayers);
          return;
        }

        // Remove existing layers if any
        if (map.getLayer(labelsLayerId)) map.removeLayer(labelsLayerId);
        if (map.getLayer(pointsLayerId)) map.removeLayer(pointsLayerId);
        if (map.getLayer(conesLayerId)) map.removeLayer(conesLayerId);
        if (map.getLayer(overallConeLayerId)) map.removeLayer(overallConeLayerId);
        if (map.getLayer(forecastLineLayerId)) map.removeLayer(forecastLineLayerId);
        if (map.getLayer(pastLineLayerId)) map.removeLayer(pastLineLayerId);
        if (map.getSource(conesSourceId)) map.removeSource(conesSourceId);
        if (map.getSource(overallConeSourceId)) map.removeSource(overallConeSourceId);
        if (map.getSource(pointsSourceId)) map.removeSource(pointsSourceId);
        if (map.getSource(forecastLineSourceId)) map.removeSource(forecastLineSourceId);
        if (map.getSource(pastLineSourceId)) map.removeSource(pastLineSourceId);

        // Create GeoJSON data
        const lineData = createTrackLineGeometry(tracks, 3);
        const pointsData = createTrackPointsGeometry(tracks);
        const conesData = createForecastConesGeometry(tracks, 3);
        const overallConeData = createOverallConeGeometry(tracks, 3);
        
        console.log('📊 Track data:', {
          pastLineCoords: lineData.past.geometry.coordinates.length,
          forecastLineCoords: lineData.forecast.geometry.coordinates.length,
          pointsCount: pointsData.features.length,
          conesCount: conesData.features.length,
          hasOverallCone: !!overallConeData
        });

        // Add past line source (black)
        map.addSource(pastLineSourceId, {
          type: 'geojson',
          data: lineData.past as any
        });

        // Add forecast line source (grey)
        map.addSource(forecastLineSourceId, {
          type: 'geojson',
          data: lineData.forecast as any
        });

        // Add points source
        map.addSource(pointsSourceId, {
          type: 'geojson',
          data: pointsData as any
        });

        // Add forecast cones source
        map.addSource(conesSourceId, {
          type: 'geojson',
          data: conesData as any
        });

        // Add overall cone source (if available)
        if (overallConeData) {
          map.addSource(overallConeSourceId, {
            type: 'geojson',
            data: overallConeData as any
          });
        }

        // 1. Add overall forecast cone (green shaded area) - Bottom layer
        if (overallConeData && map.getSource(overallConeSourceId)) {
          map.addLayer({
            id: overallConeLayerId,
            type: 'fill',
            source: overallConeSourceId,
            paint: {
              'fill-color': 'rgba(0, 255, 0, 0.15)', // Light green tint
              'fill-opacity': 0.3
            }
          });
          console.log('✅ Added overall cone layer');
        }

        // 2. Add past track line (black)
        map.addLayer({
          id: pastLineLayerId,
          type: 'line',
          source: pastLineSourceId,
          paint: {
            'line-color': '#000000',
            'line-width': 2,
            'line-opacity': 0.9
          }
        });
        console.log('✅ Added past line layer');

        // 3. Add forecast track line (grey)
        map.addLayer({
          id: forecastLineLayerId,
          type: 'line',
          source: forecastLineSourceId,
          paint: {
            'line-color': '#808080',
            'line-width': 2,
            'line-opacity': 0.8
          }
        });
        console.log('✅ Added forecast line layer');

        // 2. Add forecast uncertainty cones - White circles
        map.addLayer({
          id: conesLayerId,
          type: 'circle',
          source: conesSourceId,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4, ['*', ['get', 'radius'], 15],   // At zoom 4 (giảm từ 50 xuống 15)
              6, ['*', ['get', 'radius'], 25],   // At zoom 6 (thêm level 6x)
              8, ['*', ['get', 'radius'], 40],   // At zoom 8 (giảm từ 100 xuống 40)
              12, ['*', ['get', 'radius'], 80]   // At zoom 12 (giảm từ 200 xuống 80)
            ],
            'circle-color': 'rgba(0, 0, 0, 0)', // Transparent fill
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,  // Giảm từ 2 xuống 1 để mỏng hơn
            'circle-stroke-opacity': 0.4  // Giảm từ 0.7 xuống 0.4 để mờ hơn, không rối mắt
          }
        });
        console.log('✅ Added cones layer');

        // 4. Add track points - Black for past, Red for forecast
        map.addLayer({
          id: pointsLayerId,
          type: 'circle',
          source: pointsSourceId,
          paint: {
            'circle-radius': [
              'case',
              ['get', 'is_forecast'],
              4,  // Forecast points: 4px (giảm từ 8)
              3   // Past points: 3px (giảm từ 6)
            ],
            'circle-color': [
              'case',
              ['get', 'is_forecast'],
              '#ff0000',  // Red for forecast
              '#000000'   // Black for past
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
            'circle-opacity': 1
          }
        });
        console.log('✅ Added points layer');

        // 5. Add timestamp labels - format "DD-HHh" (ví dụ: "20-15h")
        map.addLayer({
          id: labelsLayerId,
          type: 'symbol',
          source: pointsSourceId,
          layout: {
            'text-field': ['get', 'display_time'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 11,
            'text-anchor': 'left',
            'text-offset': [1.2, 0],
            'text-allow-overlap': false,
            'text-ignore-placement': false
          },
          paint: {
            'text-color': '#000000',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.5
          }
        });
        console.log('✅ Added labels layer');

        console.log('✅ Storm track layers added (Windy style)');
        setLayerReady(true);
        
        // Fly to storm track location (Philippines)
        if (tracks.length > 0) {
          // Center on middle of track
          const midPoint = tracks[Math.floor(tracks.length / 2)];
          console.log(`🎯 Flying to storm location: [${midPoint.lon}, ${midPoint.lat}]`);
          
          setTimeout(() => {
            map.flyTo({
              center: [midPoint.lon, midPoint.lat],
              zoom: 7,
              duration: 2000
            });
          }, 1000);
        }
      } catch (error) {
        console.error('❌ Error adding storm track layers:', error);
      }
    };

    addStormTrackLayers();

    // Cleanup
    return () => {
      // Don't remove layers here to avoid flicker
    };
  }, [map, enabled, tracks]);

  // No pulse animation needed - keeping it simple like Windy

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!map) return;

      try {
        const labelsLayerId = 'storm-track-labels-layer';
        const pointsLayerId = 'storm-track-points-layer';
        const conesLayerId = 'storm-track-cones-layer';
        const overallConeLayerId = 'storm-track-overall-cone-layer';
        const forecastLineLayerId = 'storm-track-forecast-line-layer';
        const pastLineLayerId = 'storm-track-past-line-layer';
        const conesSourceId = 'storm-track-cones';
        const overallConeSourceId = 'storm-track-overall-cone';
        const pointsSourceId = 'storm-track-points';
        const forecastLineSourceId = 'storm-track-forecast-line';
        const pastLineSourceId = 'storm-track-past-line';

        if (map.getLayer(labelsLayerId)) map.removeLayer(labelsLayerId);
        if (map.getLayer(pointsLayerId)) map.removeLayer(pointsLayerId);
        if (map.getLayer(conesLayerId)) map.removeLayer(conesLayerId);
        if (map.getLayer(overallConeLayerId)) map.removeLayer(overallConeLayerId);
        if (map.getLayer(forecastLineLayerId)) map.removeLayer(forecastLineLayerId);
        if (map.getLayer(pastLineLayerId)) map.removeLayer(pastLineLayerId);
        if (map.getSource(conesSourceId)) map.removeSource(conesSourceId);
        if (map.getSource(overallConeSourceId)) map.removeSource(overallConeSourceId);
        if (map.getSource(pointsSourceId)) map.removeSource(pointsSourceId);
        if (map.getSource(forecastLineSourceId)) map.removeSource(forecastLineSourceId);
        if (map.getSource(pastLineSourceId)) map.removeSource(pastLineSourceId);
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [map]);

  return null;
}

