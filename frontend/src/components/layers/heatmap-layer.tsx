"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet"; // import Leaflet
import "leaflet.heat";   // patch L.heatLayer
import type { HeatPoint } from "../heatmap-utils";

export default function HeatmapLayer({ data }: { data: HeatPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || data.length === 0) return;

    const heatPoints: [number, number, number][] = data.map((p) => [
      p.lat,
      p.lng,
      p.intensity,
    ]);

    const maxIntensity = Math.max(...heatPoints.map((p) => p[2]), 0.1);

    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 35,              // Bán kính ảnh hưởng (px)
      blur: 30,                // Độ mờ (px)
      maxZoom: 18,             // Max zoom để hiển thị
      minOpacity: 0.4,         // Độ mờ tối thiểu (thấy nền bản đồ)
      max: maxIntensity,       // Giá trị max để scale màu
      gradient: {
        // Gradient màu cho mức độ khẩn cấp cứu trợ
        0.0: "rgba(0, 0, 255, 0)",      // Không khẩn cấp (trong suốt)
        0.2: "rgba(0, 255, 255, 0.5)",  // Thấp (cyan nhạt)
        0.4: "rgba(0, 255, 0, 0.6)",    // Trung bình thấp (xanh lá)
        0.6: "rgba(255, 255, 0, 0.7)",  // Trung bình (vàng)
        0.8: "rgba(255, 165, 0, 0.85)", // Cao (cam)
        1.0: "rgba(255, 0, 0, 0.95)",   // Rất khẩn cấp (đỏ)
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, data]);

  return null;
}
