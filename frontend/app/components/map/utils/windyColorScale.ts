// Custom color scale giống Windy.com - CHÍNH XÁC
// Màu sắc dựa trên tốc độ gió (m/s) - extracted từ Windy.com

// Color stops cho Windy.com gradient (normalized 0-1, speed 0-30 m/s)
export const WINDY_COLOR_STOPS: Array<[number, string]> = [
  [0.0, '#6271b7'],   // 0 m/s - Deep purplish-blue
  [0.1, '#39619f'],   // 3 m/s - Blue
  [0.2, '#4a94a9'],   // 6 m/s - Teal/cyan
  [0.3, '#4d8d7b'],   // 9 m/s - Green-blue
  [0.4, '#53a553'],   // 12 m/s - Green
  [0.5, '#359f35'],   // 15 m/s - Bright green
  [0.6, '#a79d51'],   // 18 m/s - Yellow-green
  [0.65, '#9f7f3a'],  // 19.5 m/s - Yellow
  [0.7, '#a16c5c'],   // 21 m/s - Light orange
  [0.75, '#813a4e'],  // 22.5 m/s - Orange-red
  [0.8, '#af5088'],   // 24 m/s - Pink
  [0.85, '#754a93'],  // 25.5 m/s - Purple
  [0.9, '#6d61a3'],   // 27 m/s - Deep purple
  [0.95, '#44698d'],  // 28.5 m/s - Purple-blue
  [1.0, '#5c9098'],   // 30+ m/s - Teal-blue
];

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

// Interpolate between two colors
function interpolateColor(
  color1: [number, number, number],
  color2: [number, number, number],
  factor: number
): [number, number, number] {
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * factor),
    Math.round(color1[1] + (color2[1] - color1[1]) * factor),
    Math.round(color1[2] + (color2[2] - color1[2]) * factor),
  ];
}

// Get color for a normalized value (0-1)
export function getWindyColor(normalizedValue: number): [number, number, number] {
  // Clamp value
  const value = Math.max(0, Math.min(1, normalizedValue));

  // Find the two color stops to interpolate between
  for (let i = 0; i < WINDY_COLOR_STOPS.length - 1; i++) {
    const [stop1, color1Hex] = WINDY_COLOR_STOPS[i];
    const [stop2, color2Hex] = WINDY_COLOR_STOPS[i + 1];

    if (value >= stop1 && value <= stop2) {
      // Interpolate between these two colors
      const factor = (value - stop1) / (stop2 - stop1);
      const color1 = hexToRgb(color1Hex);
      const color2 = hexToRgb(color2Hex);
      return interpolateColor(color1, color2, factor);
    }
  }

  // Fallback to last color
  const [, lastColorHex] = WINDY_COLOR_STOPS[WINDY_COLOR_STOPS.length - 1];
  return hexToRgb(lastColorHex);
}

// Render wind data to canvas with Windy.com color scale
export function renderWindyStyle(
  canvas: HTMLCanvasElement,
  data: Float32Array,
  width: number,
  height: number,
  domain: [number, number] = [0, 30]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('❌ Cannot get canvas context');
    return;
  }

  // Set canvas size
  canvas.width = width;
  canvas.height = height;

  const [minValue, maxValue] = domain;
  const range = maxValue - minValue;

  // Create ImageData for faster rendering
  const imageData = ctx.createImageData(width, height);

  // QUAN TRỌNG: Mapping TIFF pixels sang canvas
  // - TIFF của bạn: Upper Left = (-180, 90), Lower Right = (180, -90)
  //   => Y = 0 (top) = 90°N, Y = height-1 (bottom) = -90°S
  // - Canvas: Y = 0 ở top, Y = height-1 ở bottom
  // - Mapbox coordinates: [west, north] = top-left, [east, south] = bottom-right
  // => Vì TIFF đã đúng thứ tự (top = 90°, bottom = -90°), KHÔNG CẦN flip!
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Đọc data từ TIFF (Y từ trên xuống: 90° → -90°)
      const dataIdx = y * width + x;
      const value = data[dataIdx];

      // Normalize value to 0-1
      const normalized = Math.max(0, Math.min(1, (value - minValue) / range));

      // Get color from Windy.com color scale
      const [r, g, b] = getWindyColor(normalized);

      // Viết trực tiếp vào canvas KHÔNG flip
      // Vì TIFF đã có thứ tự đúng: top = 90°N, bottom = -90°S
      const pixelIdx = (y * width + x) * 4;
      
      imageData.data[pixelIdx] = r;     // R
      imageData.data[pixelIdx + 1] = g; // G
      imageData.data[pixelIdx + 2] = b; // B
      imageData.data[pixelIdx + 3] = 255; // A (opaque)
    }
  }

  // Put image data to canvas
  ctx.putImageData(imageData, 0, 0);
  
  console.log(`✅ Rendered wind canvas: ${width}x${height} (TIFF coordinate system preserved: top=90°N, bottom=-90°S)`);
}

// Legacy exports for compatibility
export const WINDY_COLOR_SCALE = 'windy-custom';
export const WINDY_COLORS = [
  { speed: 0, color: '#6271b7', label: 'Calm' },
  { speed: 3, color: '#39619f', label: 'Light Air' },
  { speed: 6, color: '#4a94a9', label: 'Light Breeze' },
  { speed: 9, color: '#4d8d7b', label: 'Gentle Breeze' },
  { speed: 12, color: '#53a553', label: 'Moderate' },
  { speed: 15, color: '#359f35', label: 'Fresh' },
  { speed: 18, color: '#a79d51', label: 'Strong' },
  { speed: 20, color: '#9f7f3a', label: 'Near Gale' },
  { speed: 21, color: '#a16c5c', label: 'Gale' },
  { speed: 23, color: '#813a4e', label: 'Strong Gale' },
  { speed: 24, color: '#af5088', label: 'Storm' },
  { speed: 26, color: '#754a93', label: 'Violent Storm' },
  { speed: 27, color: '#6d61a3', label: 'Hurricane' },
  { speed: 29, color: '#44698d', label: 'Hurricane+' },
  { speed: 30, color: '#5c9098', label: 'Extreme' },
];

