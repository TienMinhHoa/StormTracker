// heatmap-utils.ts

export interface RescueRequest {
  lat: number;
  lng: number;
  severity: number;
  timestamp: number;
}

export interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

// Weight thời gian: càng mới càng nặng
const timeWeight = (timestamp: number) => {
  const ageHours = (Date.now() / 1000 - timestamp) / 3600;
  return Math.max(0.2, 1 - ageHours / 24); 
};

// Grid size ~1km
const GRID_SIZE = 0.01;

export const computeHeatmapFromRescueData = (
  data: RescueRequest[]
): HeatPoint[] => {
  const gridMap = new Map<string, { lat: number; lng: number; intensity: number; count: number }>();

  data.forEach(req => {
    const gridX = Math.floor(req.lng / GRID_SIZE);
    const gridY = Math.floor(req.lat / GRID_SIZE);
    const key = `${gridX}-${gridY}`;

    const weight = timeWeight(req.timestamp);
    const score = req.severity * weight;

    if (!gridMap.has(key)) {
      gridMap.set(key, {
        lat: req.lat,
        lng: req.lng,
        intensity: 0,
        count: 0,
      });
    }

    const cell = gridMap.get(key)!;
    cell.intensity += score;
    cell.count++;
  });

  // Convert sang array để vẽ heatmap
  return [...gridMap.values()].map((c) => ({
    lat: c.lat,
    lng: c.lng,
    intensity: c.intensity,
  }));
};
