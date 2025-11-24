/**
 * Wind Particles Layer - WebGL-based high-performance animation
 * Tận dụng wind data từ TIFF giống WindLayer
 * Sử dụng WebGL để render particles mượt mà (60 FPS)
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { WebGLWindParticlesRenderer } from './webgl/WebGLWindParticlesRenderer';
import { loadWindDataForTimestamp, AVAILABLE_TIMESTAMPS, type TIFFWindData } from './services/tiffService';

interface WindParticlesLayerProps {
  map: mapboxgl.Map | null;
  enabled?: boolean;
  timestamp?: string;
  opacity?: number;
}

export default function WindParticlesLayer({
  map,
  enabled = true,
  timestamp,
  opacity = 0.8
}: WindParticlesLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<WebGLWindParticlesRenderer | null>(null);
  const layerId = 'wind-particles-layer';
  const [windData, setWindData] = useState<TIFFWindData | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize WebGL canvas and renderer
  useEffect(() => {
    if (!enabled) return;

    const canvas = document.createElement('canvas');
    // Use same resolution as wind data for best quality
    canvas.width = 1440;
    canvas.height = 720;
    canvasRef.current = canvas;

    try {
      const renderer = new WebGLWindParticlesRenderer(canvas, {
        numParticles: 30000, // More particles for Windy.com style density
        speedFactor: 0.2,    // Windy.com style speed (slightly slower for smoother motion)
        fadeOpacity: 0.997,  // Very smooth fade trails (Windy.com style)
        dropRate: 0.002,    // Lower drop rate for longer trails
        dropRateBump: 0.008, // Extra drops in fast wind areas
        particleMaxAge: 12,  // Longer lifetime for smoother trails
        opacity: opacity
      });

      rendererRef.current = renderer;
      console.log('✅ WebGL particles renderer initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WebGL particles renderer:', error);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [enabled, opacity]);

  // Load wind data from TIFF
  useEffect(() => {
    if (!map || !enabled || !rendererRef.current) return;

    const loadData = async () => {
      try {
        const targetTimestamp = timestamp || AVAILABLE_TIMESTAMPS[0]?.timestamp;
        if (!targetTimestamp) return;

        console.log(`🌀 Loading particles wind data: ${targetTimestamp}`);

        const data = await loadWindDataForTimestamp(targetTimestamp);
        console.log(`✅ Loaded wind data: ${data.width}x${data.height}`);

        // Load into WebGL renderer
        if (rendererRef.current) {
          rendererRef.current.loadWindData(data);
        }
        setWindData(data);
      } catch (error) {
        console.error('❌ Failed to load particles data:', error);
      }
    };

    loadData();
  }, [map, enabled, timestamp]);

  // Add layer to map and start animation
  useEffect(() => {
    if (!map || !enabled || !windData || !rendererRef.current || !canvasRef.current) {
      return;
    }

    console.log('🎨 Adding WebGL particles layer to map...');

    const addLayerToMap = () => {
      if (!map.isStyleLoaded()) {
        map.once('style.load', addLayerToMap);
        return;
      }

      const [west, south, east, north] = windData.bbox;
      const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
        [west, north],
        [east, north],
        [east, south],
        [west, south]
      ];

      // Remove existing layer/source
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(layerId)) {
        map.removeSource(layerId);
      }

      // Add source with initial canvas
      map.addSource(layerId, {
        type: 'image',
        url: canvasRef.current!.toDataURL(),
        coordinates: coordinates
      });

      // Add layer on TOP (no beforeId = automatically top layer)
      // This ensures particles are always visible above everything
      map.addLayer({
        id: layerId,
        type: 'raster',
        source: layerId,
        paint: {
          'raster-opacity': 1.0, // Opacity controlled by renderer
          'raster-fade-duration': 0
        }
      });
      // Note: No beforeId means this layer is added on top of all existing layers
      // If other layers are added after, they will be below this one

      console.log('✅ WebGL particles layer added (TOP LAYER)');

      // Animation loop: render particles and update image source
      // Use identity matrix since particles are in normalized [0,1] space
      // and will be mapped to bbox via ImageSource
      const identityMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]);

      // Single animation loop: render particles and update ImageSource (60 FPS)
      const animate = () => {
        if (!map || !rendererRef.current || !canvasRef.current) return;

        // Render particles to canvas
        rendererRef.current.render(identityMatrix);

        // Update image source with new frame
        const dataUrl = canvasRef.current.toDataURL();
        const source = map.getSource(layerId) as mapboxgl.ImageSource;
        if (source && source.updateImage) {
          source.updateImage({ url: dataUrl, coordinates });
        }

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      // Start animation loop (60 FPS)
      animationFrameRef.current = requestAnimationFrame(animate);
      console.log('✅ Particles animation started (60 FPS)');
    };

    addLayerToMap();

    return () => {
      // Stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.stopAnimation();
      }
      // Cleanup map layer
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(layerId)) {
        map.removeSource(layerId);
      }
    };
  }, [map, enabled, windData]);

  // Update opacity when it changes
  useEffect(() => {
    if (rendererRef.current && enabled) {
      rendererRef.current.updateOptions({ opacity });
    }
  }, [opacity, enabled]);

  return null;
}
