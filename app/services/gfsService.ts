// Service để xử lý dữ liệu GFS (Global Forecast System)

import { loadWindDataFromTIFF } from './tiffService';

export interface WindData {
  u: Float32Array; // U component của gió (đông-tây)
  v: Float32Array; // V component của gió (nam-bắc)
  speed: Float32Array; // Tốc độ gió (m/s)
  width: number;
  height: number;
  bbox: [number, number, number, number]; // [west, south, east, north]
}

// TIFF file paths for wind data
const U_TIFF_FILE = '/20251115_100.tif';
const V_TIFF_FILE = '/20251115_100.tif';

// Hàm để load dữ liệu gió từ TIFF files
export async function fetchGFSWindData(
  forecastHour: number = 0,
  resolution: number = 0.25 // độ (not used for TIFF, kept for compatibility)
): Promise<WindData> {
  try {
    console.log(`🌐 Fetching GFS data for +${forecastHour}h forecast...`);

    // Load from TIFF files (real data only)
    console.log('📂 Loading wind data from TIFF files...');
    const tiffData = await loadWindDataFromTIFF(U_TIFF_FILE, V_TIFF_FILE);
    
    console.log('✅ Successfully loaded wind data from TIFF files');
    return {
      u: tiffData.u,
      v: tiffData.v,
      speed: tiffData.speed,
      width: tiffData.width,
      height: tiffData.height,
      bbox: tiffData.bbox
    };

  } catch (error) {
    console.error('❌ Error fetching GFS data:', error);
    throw error;
  }
}


// Hàm để parse dữ liệu GRIB2 (cần thư viện chuyên biệt)
// export async function parseGRIB2Data(buffer: ArrayBuffer): Promise<WindData> {
//   // Sử dụng thư viện như 'grib2js' hoặc 'eccodes' để parse
//   // Đây là pseudocode
//
//   const grib = new GRIB2Parser(buffer);
//   const uData = grib.getVariable('UGRD'); // U-wind component
//   const vData = grib.getVariable('VGRD'); // V-wind component
//
//   return {
//     u: uData.data,
//     v: vData.data,
//     speed: calculateWindSpeed(uData.data, vData.data),
//     width: uData.width,
//     height: uData.height,
//     bbox: uData.bbox
//   };
// }

// Tính tốc độ gió từ components U và V
function calculateWindSpeed(u: Float32Array, v: Float32Array): Float32Array {
  const speed = new Float32Array(u.length);
  for (let i = 0; i < u.length; i++) {
    speed[i] = Math.sqrt(u[i] * u[i] + v[i] * v[i]);
  }
  return speed;
}

// Chuyển đổi tọa độ từ index sang lat/lng
export function indexToLatLng(
  x: number,
  y: number,
  width: number,
  height: number,
  bbox: [number, number, number, number]
): [number, number] {
  const [west, south, east, north] = bbox;
  const lng = west + (x / width) * (east - west);
  const lat = north - (y / height) * (north - south);
  return [lng, lat];
}

// Chuyển đổi lat/lng sang index
export function latLngToIndex(
  lng: number,
  lat: number,
  width: number,
  height: number,
  bbox: [number, number, number, number]
): [number, number] {
  const [west, south, east, north] = bbox;
  const x = Math.floor(((lng - west) / (east - west)) * width);
  const y = Math.floor(((north - lat) / (north - south)) * height);
  return [x, y];
}

