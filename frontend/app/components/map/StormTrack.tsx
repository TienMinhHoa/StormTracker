'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { mockStormTracks, StormTrack as StormTrackData, StormTrackPoint } from '../../data/stormTracks';

interface StormTrackProps {
  map: mapboxgl.Map | null;
  enabled?: boolean;
  selectedStormId?: string;
}

export default function StormTrack({
  map,
  enabled = true,
  selectedStormId
}: StormTrackProps) {
  const animationFrameRef = useRef<number | null>(null);
  const pulseRadiusRef = useRef<number>(1);
  const pulseDirectionRef = useRef<number>(1); // 1 = growing, -1 = shrinking

  // Get active storm data
  const activeStorm = selectedStormId
    ? mockStormTracks.find(storm => storm.storm_id === selectedStormId) || mockStormTracks[0]
    : mockStormTracks[0];

  // Convert StormTrackPoint to GeoJSON features
  const createTrackLineFeature = useCallback((points: StormTrackPoint[]): GeoJSON.Feature => {
    return {
      type: 'Feature',
      properties: {
        storm_id: points[0]?.storm_id || '',
        name: activeStorm?.name || ''
      },
      geometry: {
        type: 'LineString',
        coordinates: points.map(point => [point.lon, point.lat])
      }
    };
  }, [activeStorm]);

  const createTrackPointsFeatures = useCallback((points: StormTrackPoint[]): GeoJSON.Feature[] => {
    return points.map((point, index) => ({
      type: 'Feature',
      properties: {
        storm_id: point.storm_id,
        wind_speed: point.wind_speed,
        category: point.category,
        timestamp: point.timestamp,
        is_last_point: index === points.length - 1
      },
      geometry: {
        type: 'Point',
        coordinates: [point.lon, point.lat]
      }
    }));
  }, []);

  // Pulse animation for last point
  const startPulseAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const animate = () => {
      pulseRadiusRef.current += pulseDirectionRef.current * 0.15; // Speed of animation

      if (pulseRadiusRef.current >= 4) {
        pulseDirectionRef.current = -1; // Start shrinking
      } else if (pulseRadiusRef.current <= 1) {
        pulseDirectionRef.current = 1; // Start growing
      }

      // Update pulse circle radius
      if (map && map.getLayer('storm-track-pulse')) {
        try {
          map.setPaintProperty('storm-track-pulse', 'circle-radius', pulseRadiusRef.current);
        } catch (error) {
          // Layer might not exist yet
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [map]);

  const stopPulseAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Main effect to add/remove storm track layers
  useEffect(() => {
    if (!map || !enabled || !activeStorm) {
      // Remove all layers if disabled
      stopPulseAnimation();

      try {
        const layersToRemove = [
          'storm-track-line',
          'storm-track-points',
          'storm-track-pulse'
        ];

        const sourcesToRemove = [
          'storm-track-line-source',
          'storm-track-points-source',
          'storm-track-pulse-source'
        ];

        layersToRemove.forEach(layerId => {
          if (map && map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        });

        sourcesToRemove.forEach(sourceId => {
          if (map && map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        });

        console.log('🗑️ Removed all storm track layers');
      } catch (error) {
        console.error('❌ Error removing storm track layers:', error);
      }

      return;
    }

    const addLayersToMap = () => {
      try {
        console.log('🌪️ Adding storm track layers for:', activeStorm.name);

        // 1. Line layer - đường track vàng/cam
        const lineSourceId = 'storm-track-line-source';
        const lineLayerId = 'storm-track-line';

        if (!map.getSource(lineSourceId)) {
          map.addSource(lineSourceId, {
            type: 'geojson',
            data: createTrackLineFeature(activeStorm.points)
          });

          map.addLayer({
            id: lineLayerId,
            type: 'line',
            source: lineSourceId,
            paint: {
              'line-color': '#ffad33', // Vàng/cam
              'line-width': 3,
              'line-opacity': 0.9
            }
          });
        } else {
          (map.getSource(lineSourceId) as mapboxgl.GeoJSONSource).setData(createTrackLineFeature(activeStorm.points));
        }

        // 2. Points layer - các chấm theo cấp gió
        const pointsSourceId = 'storm-track-points-source';
        const pointsLayerId = 'storm-track-points';

        if (!map.getSource(pointsSourceId)) {
          map.addSource(pointsSourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: createTrackPointsFeatures(activeStorm.points)
            }
          });

          map.addLayer({
            id: pointsLayerId,
            type: 'circle',
            source: pointsSourceId,
            paint: {
              // Circle radius: 2 → 5 theo wind speed (rất nhỏ để nhìn toàn thể ở zoom 6x)
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'wind_speed'],
                20, 2,   // 20 m/s → radius 2
                80, 5    // 80 m/s → radius 5
              ],
              // Circle color: interpolate theo wind speed
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'wind_speed'],
                20, '#00bfff',  // 20 m/s → light blue
                40, '#00ff00',  // 40 m/s → green
                60, '#ffff00',  // 60 m/s → yellow
                80, '#ff0000'   // 80 m/s → red
              ],
              // White border
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2
            }
          });
        } else {
          (map.getSource(pointsSourceId) as mapboxgl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: createTrackPointsFeatures(activeStorm.points)
          });
        }

        // 3. Pulse layer - chỉ cho điểm cuối cùng
        const lastPoint = activeStorm.points[activeStorm.points.length - 1];
        const pulseSourceId = 'storm-track-pulse-source';
        const pulseLayerId = 'storm-track-pulse';

        if (!map.getSource(pulseSourceId)) {
          map.addSource(pulseSourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [lastPoint.lon, lastPoint.lat]
              },
              properties: {
                storm_id: lastPoint.storm_id,
                wind_speed: lastPoint.wind_speed
              }
            }
          });

          map.addLayer({
            id: pulseLayerId,
            type: 'circle',
            source: pulseSourceId,
            paint: {
              'circle-radius': 1, // Will be animated
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'wind_speed'],
                20, '#00bfff',
                40, '#00ff00',
                60, '#ffff00',
                80, '#ff0000'
              ],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 3,
              'circle-opacity': 0.8
            }
          });
        } else {
          (map.getSource(pulseSourceId) as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lastPoint.lon, lastPoint.lat]
            },
            properties: {
              storm_id: lastPoint.storm_id,
              wind_speed: lastPoint.wind_speed
            }
          });
        }

        // Start pulse animation
        startPulseAnimation();

        console.log('✅ Storm track layers added successfully');
      } catch (error) {
        console.error('❌ Error adding storm track layers:', error);
      }
    };

    // Wait for map style to load
    if (map.isStyleLoaded()) {
      addLayersToMap();
    } else {
      map.once('style.load', addLayersToMap);
    }

    // Cleanup function
    return () => {
      stopPulseAnimation();
      if (map) {
        map.off('style.load', addLayersToMap);
      }
    };
  }, [map, enabled, activeStorm, createTrackLineFeature, createTrackPointsFeatures, startPulseAnimation, stopPulseAnimation]);

  return null;
}
