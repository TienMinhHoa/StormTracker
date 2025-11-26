// Service để đọc TIFF files (GeoTIFF) cho wind data

import { fromUrl, fromBlob } from 'geotiff';

// Interface cho timestamp data
export interface WindTimestamp {
  timestamp: string; // Format: "YYYY-MM-DD HH:MM"
  uFile: string;
  vFile: string;
}

// Danh sách các timestamp có sẵn trong thư mục GFS_process
// Tất cả timestamps có sẵn trong thư mục GFS_process
export const ALL_AVAILABLE_TIMESTAMPS: WindTimestamp[] = [
  // 2025-11-20
  { timestamp: "2025-11-20 15:00", uFile: "/GFS_process/U/2025/11/20/20251120_1500.tif", vFile: "/GFS_process/V/2025/11/20/20251120_1500.tif" },
  { timestamp: "2025-11-20 16:00", uFile: "/GFS_process/U/2025/11/20/20251120_1600.tif", vFile: "/GFS_process/V/2025/11/20/20251120_1600.tif" },
  { timestamp: "2025-11-20 17:00", uFile: "/GFS_process/U/2025/11/20/20251120_1700.tif", vFile: "/GFS_process/V/2025/11/20/20251120_1700.tif" },
  { timestamp: "2025-11-20 18:00", uFile: "/GFS_process/U/2025/11/20/20251120_1800.tif", vFile: "/GFS_process/V/2025/11/20/20251120_1800.tif" },
  { timestamp: "2025-11-20 19:00", uFile: "/GFS_process/U/2025/11/20/20251120_1900.tif", vFile: "/GFS_process/V/2025/11/20/20251120_1900.tif" },
  { timestamp: "2025-11-20 20:00", uFile: "/GFS_process/U/2025/11/20/20251120_2000.tif", vFile: "/GFS_process/V/2025/11/20/20251120_2000.tif" },
  { timestamp: "2025-11-20 21:00", uFile: "/GFS_process/U/2025/11/20/20251120_2100.tif", vFile: "/GFS_process/V/2025/11/20/20251120_2100.tif" },
  { timestamp: "2025-11-20 22:00", uFile: "/GFS_process/U/2025/11/20/20251120_2200.tif", vFile: "/GFS_process/V/2025/11/20/20251120_2200.tif" },
  { timestamp: "2025-11-20 23:00", uFile: "/GFS_process/U/2025/11/20/20251120_2300.tif", vFile: "/GFS_process/V/2025/11/20/20251120_2300.tif" },

  // 2025-11-21
  { timestamp: "2025-11-21 00:00", uFile: "/GFS_process/U/2025/11/21/20251121_000.tif", vFile: "/GFS_process/V/2025/11/21/20251121_000.tif" },
  { timestamp: "2025-11-21 01:00", uFile: "/GFS_process/U/2025/11/21/20251121_100.tif", vFile: "/GFS_process/V/2025/11/21/20251121_100.tif" },
  { timestamp: "2025-11-21 02:00", uFile: "/GFS_process/U/2025/11/21/20251121_200.tif", vFile: "/GFS_process/V/2025/11/21/20251121_200.tif" },
  { timestamp: "2025-11-21 03:00", uFile: "/GFS_process/U/2025/11/21/20251121_300.tif", vFile: "/GFS_process/V/2025/11/21/20251121_300.tif" },
];

/**
 * Tính toán khoảng thời gian hiển thị trên thanh thời gian
 * - Thời gian cuối cùng: thời gian cuối cùng trong thư mục
 * - Thời gian bắt đầu: trước đó 5 ngày, hoặc thời gian đầu tiên nếu khoảng cách < 5 ngày
 */
function calculateDisplayTimeRange(): WindTimestamp[] {
  if (ALL_AVAILABLE_TIMESTAMPS.length === 0) return [];

  const firstTimestamp = ALL_AVAILABLE_TIMESTAMPS[0];
  const lastTimestamp = ALL_AVAILABLE_TIMESTAMPS[ALL_AVAILABLE_TIMESTAMPS.length - 1];

  // Tính khoảng cách thời gian giữa đầu và cuối (tính bằng giờ)
  const firstDate = new Date(firstTimestamp.timestamp.replace(' ', 'T'));
  const lastDate = new Date(lastTimestamp.timestamp.replace(' ', 'T'));
  const timeDiffHours = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60);

  // Nếu khoảng cách < 5 ngày (120 giờ), hiển thị tất cả
  if (timeDiffHours < 120) {
    return ALL_AVAILABLE_TIMESTAMPS;
  }

  // Nếu khoảng cách >= 5 ngày, chỉ hiển thị từ thời gian cuối cùng trở về 5 ngày
  const fiveDaysAgo = new Date(lastDate.getTime() - (5 * 24 * 60 * 60 * 1000));

  return ALL_AVAILABLE_TIMESTAMPS.filter(timestamp => {
    const timestampDate = new Date(timestamp.timestamp.replace(' ', 'T'));
    return timestampDate >= fiveDaysAgo;
  });
}

// Khoảng thời gian hiển thị trên thanh thời gian (được tính toán tự động)
export const AVAILABLE_TIMESTAMPS: WindTimestamp[] = calculateDisplayTimeRange();

export interface TIFFWindData {
  u: Float32Array; // U component (eastward wind)
  v: Float32Array; // V component (northward wind)
  speed: Float32Array; // Wind speed (calculated)
  width: number;
  height: number;
  bbox: [number, number, number, number]; // [west, south, east, north]
}

/**
 * Normalize và clamp bbox values để đảm bảo hợp lệ cho Mapbox
 * Mapbox yêu cầu: longitude [-180, 180], latitude [-90, 90]
 * Web Mercator thực tế: latitude [-85, 85]
 */
function normalizeBbox(bbox: [number, number, number, number]): [number, number, number, number] {
  let [west, south, east, north] = bbox;
  
  // Clamp longitude to [-180, 180]
  west = Math.max(-180, Math.min(180, west));
  east = Math.max(-180, Math.min(180, east));
  
  // Clamp latitude to [-85, 85] (Web Mercator limit, Mapbox requirement)
  south = Math.max(-85, Math.min(85, south));
  north = Math.max(-85, Math.min(85, north));
  
  // Ensure west < east and south < north
  if (west >= east) {
    console.warn('⚠️ Invalid bbox: west >= east, using global coverage');
    return [-180, -85, 180, 85];
  }
  if (south >= north) {
    console.warn('⚠️ Invalid bbox: south >= north, using global coverage');
    return [-180, -85, 180, 85];
  }
  
  // Ensure correct order
  if (west > east) {
    // Swap if needed
    [west, east] = [east, west];
  }
  if (south > north) {
    // Swap if needed
    [south, north] = [north, south];
  }
  
  return [west, south, east, north];
}

/**
 * Load wind data cho một timestamp cụ thể từ thư mục GFS_process
 */
export async function loadWindDataForTimestamp(timestamp: string): Promise<TIFFWindData> {
  const windTimestamp = AVAILABLE_TIMESTAMPS.find(t => t.timestamp === timestamp);
  if (!windTimestamp) {
    throw new Error(`Timestamp ${timestamp} not found in available data`);
  }

  return loadWindDataFromTIFF(windTimestamp.uFile, windTimestamp.vFile);
}

/**
 * Get timestamp gần nhất với thời gian hiện tại
 */
export function getCurrentTimestamp(): string {
  const now = new Date();
  const currentHour = now.getHours();

  // Tìm timestamp gần nhất
  const timestamps = AVAILABLE_TIMESTAMPS.map(t => {
    const [date, time] = t.timestamp.split(' ');
    const [hours] = time.split(':');
    return {
      timestamp: t.timestamp,
      hour: parseInt(hours)
    };
  });

  // Tìm timestamp có giờ gần nhất
  let closest = timestamps[0];
  let minDiff = Math.abs(currentHour - closest.hour);

  for (const ts of timestamps) {
    const diff = Math.abs(currentHour - ts.hour);
    if (diff < minDiff) {
      minDiff = diff;
      closest = ts;
    }
  }

  return closest.timestamp;
}

/**
 * Đọc TIFF file từ URL và trả về data array
 */
async function readTIFFData(url: string): Promise<{
  data: Float32Array;
  width: number;
  height: number;
  bbox: [number, number, number, number];
}> {
  try {
    console.log(`📥 Loading TIFF from: ${url}`);
    
    // Fetch file as blob first (for Next.js public folder)
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch TIFF: ${response.status} ${response.statusText} - URL: ${url}`);
      // Return empty data instead of throwing
      return {
        data: new Float32Array(0),
        width: 0,
        height: 0,
        bbox: [-180, -85, 180, 85]
      };
    }
    
    const blob = await response.blob();
    
    // Load TIFF from blob
    const tiff = await fromBlob(blob);
    const image = await tiff.getImage();
    
    // Get image dimensions
    const width = image.getWidth();
    const height = image.getHeight();
    
    // Get bounding box (GeoKey) and normalize for Mapbox
    let bbox: [number, number, number, number];
    try {
      const geoBbox = image.getBoundingBox();
      if (geoBbox && geoBbox.length === 4) {
        // bbox format: [minX, minY, maxX, maxY] = [west, south, east, north]
        bbox = normalizeBbox([geoBbox[0], geoBbox[1], geoBbox[2], geoBbox[3]]);
      } else {
        // Fallback: assume global coverage
        bbox = [-180, -85, 180, 85];
      }
    } catch (e) {
      // If no bbox, assume global coverage
      bbox = [-180, -85, 180, 85];
    }
    
    // Read raster data with options to handle large files
    const rasters = await image.readRasters({
      interleave: false, // Keep bands separate
      fillValue: 0, // Fill no-data values with 0
    });
    
    // Get first band (or all bands if multi-band)
    const data = Array.isArray(rasters) 
      ? (rasters[0] as Float32Array) 
      : (rasters as Float32Array);
    
    console.log(`✅ Loaded TIFF: ${width}x${height}, bbox: [${bbox.join(', ')}]`);
    console.log(`   Data size: ${(data.length * 4 / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      data,
      width,
      height,
      bbox
    };
  } catch (error) {
    console.error(`❌ Error reading TIFF ${url}:`, error);
    throw error;
  }
}

/**
 * Load wind data từ U và V TIFF files
 * Nếu uFile và vFile giống nhau, sẽ đọc 2 bands từ cùng 1 file
 */
export async function loadWindDataFromTIFF(
  uFile: string = '/20251115_100.tif',
  vFile: string = '/20251115_100.tif'
): Promise<TIFFWindData> {
  try {
    console.log('🌐 Loading wind data from TIFF files...');
    console.log(`   U file: ${uFile}`);
    console.log(`   V file: ${vFile}`);
    
    let uData, vData;
    
    // If same file, try to read both bands from one file
    if (uFile === vFile) {
      console.log('📂 Same file detected, attempting to read multiple bands...');
      try {
        // Try to read both bands from same file
        const response = await fetch(uFile);
        if (!response.ok) {
          console.warn(`⚠️ Failed to fetch TIFF: ${response.status} - URL: ${uFile}`);
          throw new Error(`Failed to fetch TIFF: ${response.status}`);
        }
        const blob = await response.blob();
        const tiff = await fromBlob(blob);
        const image = await tiff.getImage();
        
        const width = image.getWidth();
        const height = image.getHeight();
        
        // Read all bands
        const rasters = await image.readRasters({
          interleave: false,
          fillValue: 0,
        });
        
        // Check number of bands (rasters can be array or single array)
        const numBands = Array.isArray(rasters) ? rasters.length : 1;
        console.log(`   File has ${numBands} band(s)`);
        
        // Get bbox and normalize for Mapbox
        let bbox: [number, number, number, number];
        try {
          const geoBbox = image.getBoundingBox();
          if (geoBbox && geoBbox.length === 4) {
            bbox = normalizeBbox([geoBbox[0], geoBbox[1], geoBbox[2], geoBbox[3]]);
          } else {
            bbox = [-180, -85, 180, 85];
          }
        } catch (e) {
          bbox = [-180, -85, 180, 85];
        }
        
        if (numBands >= 2) {
          // Multi-band file: use band 0 for U, band 1 for V
          const rasterArray = Array.isArray(rasters) ? rasters : [rasters];
          uData = {
            data: rasterArray[0] as Float32Array,
            width,
            height,
            bbox
          };
          vData = {
            data: rasterArray[1] as Float32Array,
            width,
            height,
            bbox
          };
          console.log('✅ Successfully read U and V from multi-band file');
        } else {
          // Single band: treat as U, set V to zero
          console.warn('⚠️ Single band file detected, treating as U component, V will be zero');
          const data = Array.isArray(rasters) ? (rasters[0] as Float32Array) : (rasters as Float32Array);
          uData = {
            data,
            width,
            height,
            bbox
          };
          vData = {
            data: new Float32Array(width * height), // Zero array
            width,
            height,
            bbox
          };
        }
      } catch (error) {
        console.warn('⚠️ Failed to read multi-band, trying separate files:', error);
        // Fallback to reading as separate files
        [uData, vData] = await Promise.all([
          readTIFFData(uFile),
          readTIFFData(vFile)
        ]);
      }
    } else {
      // Different files: load separately
      [uData, vData] = await Promise.all([
        readTIFFData(uFile),
        readTIFFData(vFile)
      ]);
    }
    
    // Validate dimensions match
    if (uData.width !== vData.width || uData.height !== vData.height) {
      throw new Error(
        `TIFF dimensions mismatch: U(${uData.width}x${uData.height}) vs V(${vData.width}x${vData.height})`
      );
    }
    
    const width = uData.width;
    const height = uData.height;
    const bbox = uData.bbox; // Use U bbox (should be same as V)
    
    // Calculate wind speed: speed = sqrt(u² + v²)
    const speed = new Float32Array(width * height);
    let minSpeed = Infinity;
    let maxSpeed = -Infinity;
    
    for (let i = 0; i < width * height; i++) {
      const u = uData.data[i];
      const v = vData.data[i];
      const s = Math.sqrt(u * u + v * v);
      speed[i] = s;
      
      // Calculate min/max without using spread operator (avoid stack overflow)
      if (s < minSpeed) minSpeed = s;
      if (s > maxSpeed) maxSpeed = s;
    }
    
    console.log(`✅ Calculated wind speed from U and V components`);
    console.log(`   Dimensions: ${width}x${height}`);
    console.log(`   BBox: [${bbox.join(', ')}]`);
    console.log(`   Speed range: ${minSpeed.toFixed(2)} - ${maxSpeed.toFixed(2)} m/s`);
    
    return {
      u: uData.data,
      v: vData.data,
      speed,
      width,
      height,
      bbox
    };
  } catch (error) {
    console.error('❌ Error loading wind data from TIFF:', error);
    // Return empty wind data instead of throwing
    return {
      u: new Float32Array(0),
      v: new Float32Array(0),
      width: 0,
      height: 0,
      bbox: [-180, -85, 180, 85]
    };
  }
}

