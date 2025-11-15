'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface StormPoint {
  lat: number;
  lng: number;
  timestamp: number;
  windSpeed: number;
  pressure?: number;
}

interface StormTrackProps {
  map: mapboxgl.Map | null;
  enabled?: boolean;
  stormData?: {
    name: string;
    points: StormPoint[];
    coneRadius?: number; // km
  };
}

export default function StormTrack({
  map,
  enabled = false,
  stormData = {
    name: 'Sample Storm',
    points: [
      { lat: 16.0, lng: 125.0, timestamp: Date.now(), windSpeed: 85 },
      { lat: 14.0, lng: 120.0, timestamp: Date.now() + 24*60*60*1000, windSpeed: 65 },
      { lat: 12.0, lng: 115.0, timestamp: Date.now() + 48*60*60*1000, windSpeed: 45 },
      { lat: 10.0, lng: 110.0, timestamp: Date.now() + 72*60*60*1000, windSpeed: 35 },
    ],
    coneRadius: 100, // 100km radius
  }
}: StormTrackProps) {
  const parallelTracksSourceRef = useRef<string | null>(null);
  const circlesSourceRef = useRef<string | null>(null);
  const pointsSourceRef = useRef<string | null>(null);
  const layersAddedRef = useRef<boolean>(false);

  // Function to create expanding circles geometry (forecast uncertainty circles)
  const createCirclesGeometry = (points: StormPoint[], maxRadiusKm: number = 100) => {
    const features: GeoJSON.Feature[] = [];

    points.forEach((point, index) => {
      if (index === 0) return; // Skip first point (start point)

      // Calculate expanding radius based on forecast time (increases over time)
      const radiusKm = (maxRadiusKm * (index / points.length) * 2.0);
      const radiusDegrees = radiusKm / 111.32; // Convert km to degrees approx

      // Create circle geometry
      const numPoints = 32; // More points for smoother circle
      const coordinates = [];

      // Create circle coordinates
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const x = point.lng + radiusDegrees * Math.cos(angle);
        const y = point.lat + radiusDegrees * Math.sin(angle);
        coordinates.push([x, y]);
      }
      // Close the circle
      coordinates.push(coordinates[0]);

      const circleFeature: GeoJSON.Feature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        },
        properties: {
          stormName: stormData.name,
          windSpeed: point.windSpeed,
          timestamp: point.timestamp,
          segmentIndex: index,
          totalSegments: points.length - 1,
          radiusKm: radiusKm,
          // Color gradient based on intensity
          intensity: point.windSpeed,
          // Opacity decreases with forecast time
          fillOpacity: Math.max(0.1, 0.6 - (index / points.length) * 0.4)
        }
      };

      features.push(circleFeature);
    });

    return {
      type: 'FeatureCollection' as const,
      features
    };
  };

  // Function to create V-shaped track lines (tangent to circles)
  const createVShapedTracksGeometry = (points: StormPoint[], maxRadiusKm: number = 100) => {
    const features: GeoJSON.Feature[] = [];

    // Create V-shaped tracks for each segment (tangent to circles)
    for (let i = 0; i < points.length - 1; i++) {
      const startPoint = points[i];
      const endPoint = points[i + 1];

      // Calculate radii for current segment
      const startRadius = i === 0 ? 0 : (maxRadiusKm * (i / points.length) * 2.0) / 111.32; // degrees
      const endRadius = (maxRadiusKm * ((i + 1) / points.length) * 2.0) / 111.32; // degrees

      // Calculate direction vector
      const dx = endPoint.lng - startPoint.lng;
      const dy = endPoint.lat - startPoint.lat;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0) continue; // Skip zero-length segments

      // Normalize direction vector
      const dirX = dx / length;
      const dirY = dy / length;

      // Calculate perpendicular vector
      const perpX = -dirY;
      const perpY = dirX;

      // For start point (i=0), use center point
      // For other points, calculate tangent points on the circle
      let leftStart: [number, number];
      let rightStart: [number, number];

      if (i === 0) {
        // Start from center of first point
        leftStart = [startPoint.lng, startPoint.lat];
        rightStart = [startPoint.lng, startPoint.lat];
      } else {
        // Start from tangent point on previous circle
        leftStart = [
          startPoint.lng + perpX * startRadius,
          startPoint.lat + perpY * startRadius
        ];
        rightStart = [
          startPoint.lng - perpX * startRadius,
          startPoint.lat - perpY * startRadius
        ];
      }

      // End at tangent point on current circle
      const leftEnd = [
        endPoint.lng + perpX * endRadius,
        endPoint.lat + perpY * endRadius
      ];
      const rightEnd = [
        endPoint.lng - perpX * endRadius,
        endPoint.lat - perpY * endRadius
      ];

      // Add left track line (tangent to circles)
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [leftStart, leftEnd]
        },
        properties: {
          stormName: stormData.name,
          trackSide: 'left',
          segmentIndex: i,
          lineType: 'tangent'
        }
      });

      // Add right track line (tangent to circles)
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [rightStart, rightEnd]
        },
        properties: {
          stormName: stormData.name,
          trackSide: 'right',
          segmentIndex: i,
          lineType: 'tangent'
        }
      });
    }

    return {
      type: 'FeatureCollection' as const,
      features
    };
  };

  // Function to create track points geometry
  const createTrackPointsGeometry = (points: StormPoint[]) => {
    return {
      type: 'FeatureCollection' as const,
      features: points.map((point, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat]
        },
        properties: {
          stormName: stormData.name,
          windSpeed: point.windSpeed,
          timestamp: point.timestamp,
          isStart: index === 0,
          pointIndex: index
        }
      }))
    };
  };

  useEffect(() => {
    if (!map || !enabled || !stormData.points.length) {
      // Remove layers if disabled
      try {
        const layersToRemove = [
          'storm-track-forecast-points',
          'storm-track-start-point',
          'storm-track-parallel-lines',
          'storm-track-circles'
        ];
        layersToRemove.forEach(layerId => {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        });

        const sourcesToRemove = [
          parallelTracksSourceRef.current,
          circlesSourceRef.current,
          pointsSourceRef.current
        ];
        sourcesToRemove.forEach(sourceId => {
          if (sourceId && map.getSource(sourceId)) map.removeSource(sourceId);
        });
      } catch (error) {
        console.error('Error removing storm track layers:', error);
      }
      parallelTracksSourceRef.current = null;
      circlesSourceRef.current = null;
      pointsSourceRef.current = null;
      return;
    }

    // Update source data (always update, even if layers already added)
    const updateSourceData = () => {
      try {
        const parallelTracksSourceId = 'storm-parallel-tracks-data';
        const circlesSourceId = 'storm-circles-data';
        const pointsSourceId = 'storm-points-data';

        // Update or create sources
        if (!map.getSource(parallelTracksSourceId)) {
          map.addSource(parallelTracksSourceId, {
            type: 'geojson',
            data: createVShapedTracksGeometry(stormData.points, stormData.coneRadius)
          });
        } else {
          (map.getSource(parallelTracksSourceId) as mapboxgl.GeoJSONSource).setData(createVShapedTracksGeometry(stormData.points, stormData.coneRadius));
        }

        if (!map.getSource(circlesSourceId)) {
          map.addSource(circlesSourceId, {
            type: 'geojson',
            data: createCirclesGeometry(stormData.points, stormData.coneRadius)
          });
        } else {
          (map.getSource(circlesSourceId) as mapboxgl.GeoJSONSource).setData(createCirclesGeometry(stormData.points, stormData.coneRadius));
        }

        if (!map.getSource(pointsSourceId)) {
          map.addSource(pointsSourceId, {
            type: 'geojson',
            data: createTrackPointsGeometry(stormData.points)
          });
        } else {
          (map.getSource(pointsSourceId) as mapboxgl.GeoJSONSource).setData(createTrackPointsGeometry(stormData.points));
        }

        parallelTracksSourceRef.current = parallelTracksSourceId;
        circlesSourceRef.current = circlesSourceId;
        pointsSourceRef.current = pointsSourceId;
      } catch (error) {
        console.error('❌ Error updating storm track data:', error);
      }
    };

    // Always update source data first
    updateSourceData();

    // Wait for map to be fully loaded and wind layer to exist
    const addStormTrackLayers = () => {
      // Check if layers already added - prevent re-adding
      if (layersAddedRef.current) {
        return;
      }

      // Check if wind layer exists, if not wait a bit
      if (!map.getLayer('wind-raster-layer')) {
        setTimeout(addStormTrackLayers, 100);
        return;
      }

    try {
      // Sources already created/updated in updateSourceData
      const parallelTracksSourceId = parallelTracksSourceRef.current || 'storm-parallel-tracks-data';
      const circlesSourceId = circlesSourceRef.current || 'storm-circles-data';
      const pointsSourceId = pointsSourceRef.current || 'storm-points-data';

      // Add layers with fixed display like news overlays (no flickering)
      // Add expanding circles layer (bottom layer) - fixed opacity
      if (!map.getLayer('storm-track-circles')) {
        map.addLayer({
          id: 'storm-track-circles',
          type: 'fill',
          source: circlesSourceId,
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'intensity'],
              35, '#ffeaa7',  // Light yellow for tropical storm
              65, '#ff7675',  // Orange-red for hurricane
              100, '#d63031'  // Dark red for major hurricane
            ],
            'fill-opacity': 0.7, // Higher opacity for prominence
            'fill-outline-color': [
              'interpolate',
              ['linear'],
              ['get', 'intensity'],
              35, '#ffcc00',
              65, '#ff6600',
              100, '#cc0000'
            ]
          }
        }); // No beforeId - add on top of everything
      }

      // Add V-shaped track lines (tangent to circles) - red dashed lines
      if (!map.getLayer('storm-track-parallel-lines')) {
        map.addLayer({
          id: 'storm-track-parallel-lines',
          type: 'line',
          source: parallelTracksSourceId,
          paint: {
            'line-color': '#ff0000', // Red color
            'line-width': 4, // Thicker lines for prominence
            'line-opacity': 1.0, // Full opacity to prevent flickering
            'line-dasharray': [6, 4] // Dashed pattern [dash length, gap length]
          }
        }); // No beforeId - add on top of everything
      }

      // Add start point (special marker) - always visible
      if (!map.getLayer('storm-track-start-point')) {
        map.addLayer({
          id: 'storm-track-start-point',
          type: 'circle',
          source: pointsSourceId,
          filter: ['==', 'isStart', true], // Only start point
          paint: {
            'circle-radius': 10, // Larger radius for prominence
            'circle-color': '#ff0000',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 1.0 // Full opacity
          }
        }); // No beforeId - add on top of everything
      }

      // Add forecast points (smaller circles) - always visible
      if (!map.getLayer('storm-track-forecast-points')) {
        map.addLayer({
          id: 'storm-track-forecast-points',
          type: 'circle',
          source: pointsSourceId,
          filter: ['!=', 'isStart', true], // Exclude start point
          paint: {
            'circle-radius': 7, // Larger radius for prominence
            'circle-color': [
              'interpolate',
              ['linear'],
              ['get', 'windSpeed'],
              35, '#ff9800',
              65, '#ff5722',
              100, '#d32f2f'
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 1.0 // Full opacity
          }
        }); // No beforeId - add on top of everything
      }

      // Labels removed - no text display on circles

      // Mark layers as added
      layersAddedRef.current = true;

      // Move layers to top once after adding (no periodic updates)
      setTimeout(() => {
        if (!map) return;
        try {
          const style = map.getStyle();
          if (!style || !style.layers) return;

          const stormLayers = [
            'storm-track-circles',
            'storm-track-parallel-lines',
            'storm-track-start-point',
            'storm-track-forecast-points'
          ];

          // Move each storm layer to the top (one time only)
          stormLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              const allLayers = style.layers;
              if (allLayers && allLayers.length > 0) {
                const lastLayerId = allLayers[allLayers.length - 1].id;
                if (lastLayerId !== layerId) {
                  try {
                    map.moveLayer(layerId, lastLayerId);
                  } catch (e) {
                    // Layer might already be at top, ignore
                  }
                }
              }
            }
          });
        } catch (error) {
          // Ignore errors
        }
      }, 500);

      console.log('✅ Storm track layers added to map (fixed position like news markers)');

    } catch (error) {
      console.error('❌ Error adding storm track:', error);
      layersAddedRef.current = false; // Reset on error
    }
    };

    // Start adding layers after wind layer is ready (only once)
    addStormTrackLayers();

    // Cleanup function
    return () => {
      layersAddedRef.current = false; // Reset ref on cleanup
      if (!map) return;
      try {
        // Remove all storm track layers
        const layersToRemove = [
          'storm-track-forecast-points',
          'storm-track-start-point',
          'storm-track-parallel-lines',
          'storm-track-circles'
        ];
        layersToRemove.forEach(layerId => {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        });

        // Remove sources
        const sourcesToRemove = [
          parallelTracksSourceRef.current,
          circlesSourceRef.current,
          pointsSourceRef.current
        ];
        sourcesToRemove.forEach(sourceId => {
          if (sourceId && map.getSource(sourceId)) map.removeSource(sourceId);
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [map, enabled, stormData]);

  return null; // This component doesn't render anything visible
}
