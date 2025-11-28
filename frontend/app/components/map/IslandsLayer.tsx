"use client";

import { useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';

type Props = {
  map: mapboxgl.Map | null;
  enabled?: boolean;
};

export default function IslandsLayer({ map, enabled = true }: Props) {
  useEffect(() => {
    if (!map || !enabled) return;

    const sourceId = 'islands-source';
    const fillLayerId = 'islands-fill';
    const labelLayerId = 'islands-label';

    // avoid re-adding
    if (map.getSource(sourceId)) {
      return;
    }

    // Add GeoJSON source served from public/
    map.addSource(sourceId, {
      type: 'geojson',
      data: '/data/islands.geojson',
    } as any);

    // Circle layer to highlight islands
    map.addLayer({
      id: fillLayerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['exponential', 1.5],
          ['zoom'],
          3, 4,
          6, 6,
          8, 10,
          10, 16,
        ],
        'circle-color': '#f59e0b',
        'circle-opacity': 0.85,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    });

    // Label layer
    map.addLayer({
      id: labelLayerId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, 1.25],
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0,0,0,0.6)',
        'text-halo-width': 1,
      },
    });

    return () => {
      try {
        if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [map, enabled]);

  return null;
}
