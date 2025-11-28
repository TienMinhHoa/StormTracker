// Service để đọc TIFF files (GeoTIFF) cho wind data

import { fromUrl, fromBlob } from 'geotiff';

// Interface cho timestamp data
export interface WindTimestamp {
  timestamp: string; // Format: "YYYY-MM-DD HH:MM"
  uFile: string;
  vFile: string;
}

// Cache cho danh sách timestamps đã quét
let cachedTimestamps: WindTimestamp[] = [];
let lastScanTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

/**
 * Get thời gian hiện tại theo GMT+7
 */
export function getCurrentTimeGMT7(): Date {
  // Lấy thời gian UTC và cộng 7 giờ
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const gmt7Time = new Date(utcTime + (7 * 60 * 60 * 1000));
  return gmt7Time;
}

/**
 * Quét thư mục GFS_process để lấy danh sách file TIFF có sẵn
 * Sử dụng API endpoint /api/tiff/scan để quét từ server
 * Sẽ quét 2 ngày: hôm nay và hôm qua (GMT+7)
 */
async function scanAvailableTiffFiles(): Promise<WindTimestamp[]> {
  // Kiểm tra cache
  const now = Date.now();
  if (cachedTimestamps.length > 0 && (now - lastScanTime) < CACHE_DURATION) {
    console.log('📦 Using cached TIFF file list');
    return cachedTimestamps;
  }

  console.log('🔍 Scanning GFS_process directory via API (2 days: today + yesterday)...');

  try {
    // Gọi API để quét thư mục - chỉ quét 2 ngày
    const response = await fetch('/api/tiff/scan?days=2');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to scan files');
    }

    const timestamps = data.timestamps || [];
    
    console.log(`✅ Found ${timestamps.length} TIFF files from API`);
    
    // Cập nhật cache
    cachedTimestamps = timestamps;
    lastScanTime = now;
    
    return timestamps;
  } catch (error) {
    console.error('❌ Error scanning TIFF files:', error);
    return [];
  }
}

// Danh sách timestamps sẽ được load động
export let ALL_AVAILABLE_TIMESTAMPS: WindTimestamp[] = [];

/**
 * Khởi tạo và load danh sách timestamps có sẵn
 * Hàm này nên được gọi khi component mount hoặc khi cần refresh data
 */
export async function initializeTimestamps(): Promise<WindTimestamp[]> {
  ALL_AVAILABLE_TIMESTAMPS = await scanAvailableTiffFiles();
  return ALL_AVAILABLE_TIMESTAMPS;
}

/**
 * Tính toán khoảng thời gian hiển thị trên thanh thời gian
 * Chỉ hiển thị timestamps của 2 ngày: hôm nay và hôm qua (theo GMT+7)
 */
function calculateDisplayTimeRange(): WindTimestamp[] {
  if (ALL_AVAILABLE_TIMESTAMPS.length === 0) return [];

  // Lấy thời gian hiện tại GMT+7
  const nowGMT7 = getCurrentTimeGMT7();
  
  // Tính thời điểm bắt đầu ngày hôm qua (00:00:00)
  const yesterdayStart = new Date(nowGMT7);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);
  
  // Tính thời điểm kết thúc ngày hôm nay (23:59:59)
  const todayEnd = new Date(nowGMT7);
  todayEnd.setHours(23, 59, 59, 999);

  console.log(`📅 Filtering timestamps from ${yesterdayStart.toISOString()} to ${todayEnd.toISOString()}`);

  // Lọc chỉ lấy timestamps trong khoảng từ ngày hôm qua đến hôm nay
  const filtered = ALL_AVAILABLE_TIMESTAMPS.filter(timestamp => {
    const timestampDate = new Date(timestamp.timestamp.replace(' ', 'T'));
    return timestampDate >= yesterdayStart && timestampDate <= todayEnd;
  });

  console.log(`✅ Filtered ${filtered.length} timestamps (today + yesterday)`);

  return filtered;
}

/**
 * Get danh sách timestamps để hiển thị (hôm nay + hôm qua theo GMT+7)
 */
export async function getAvailableTimestamps(): Promise<WindTimestamp[]> {
  if (ALL_AVAILABLE_TIMESTAMPS.length === 0) {
    await initializeTimestamps();
  }
  const timestamps = calculateDisplayTimeRange();
  AVAILABLE_TIMESTAMPS = timestamps; // Update export variable
  return timestamps;
}

// Export biến AVAILABLE_TIMESTAMPS để tương thích với code cũ
// Sẽ được populate bởi initializeTimestamps() hoặc getAvailableTimestamps()
export let AVAILABLE_TIMESTAMPS: WindTimestamp[] = [];

/**
 * Force refresh danh sách timestamps (clear cache)
 */
export async function refreshTimestamps(): Promise<WindTimestamp[]> {
  cachedTimestamps = [];
  lastScanTime = 0;
  return await initializeTimestamps();
}

/**
 * Filter timestamps theo khoảng thời gian của cơn bão
 * @param startDate - Ngày bắt đầu cơn bão (ISO string)
 * @param endDate - Ngày kết thúc cơn bão (ISO string hoặc null nếu đang hoạt động)
 * @returns Danh sách timestamps trong khoảng thời gian của bão
 */
export async function getTimestampsForStorm(
  startDate: string, 
  endDate: string | null
): Promise<WindTimestamp[]> {
  // Đảm bảo đã load timestamps
  if (ALL_AVAILABLE_TIMESTAMPS.length === 0) {
    await initializeTimestamps();
  }

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(); // Nếu chưa kết thúc thì dùng thời điểm hiện tại

  console.log(`🌀 Filtering timestamps for storm: ${start.toISOString()} to ${end.toISOString()}`);

  // Lọc timestamps trong khoảng thời gian của bão
  const filtered = ALL_AVAILABLE_TIMESTAMPS.filter(timestamp => {
    const tsDate = new Date(timestamp.timestamp.replace(' ', 'T'));
    return tsDate >= start && tsDate <= end;
  });

  console.log(`✅ Found ${filtered.length} timestamps for storm period`);
  
  // Update AVAILABLE_TIMESTAMPS để các component khác sử dụng
  AVAILABLE_TIMESTAMPS = filtered;
  
  return filtered;
}

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
 * 
 * QUAN TRỌNG: TIFF có AREA_OR_POINT=Area, nghĩa là bbox là pixel CORNERS
 * Nhưng data values nằm ở pixel CENTERS. Do đó KHÔNG cần điều chỉnh bbox
 * vì Mapbox sẽ stretch ảnh từ corners, đúng như TIFF định nghĩa.
 */
function normalizeBbox(bbox: [number, number, number, number]): [number, number, number, number] {
  let [west, south, east, north] = bbox;
  
  // Apply latitude offset: shift down 2.5 degrees
  const LAT_OFFSET = -2.5;
  south += LAT_OFFSET;
  north += LAT_OFFSET;
  
  console.log(`📐 BBox (original): [${bbox.join(', ')}]`);
  console.log(`📐 BBox (offset by ${LAT_OFFSET}°): [${west}, ${south}, ${east}, ${north}]`);
  
  // Clamp longitude to [-180, 180]
  west = Math.max(-180, Math.min(180, west));
  east = Math.max(-180, Math.min(180, east));
  
  // Clamp latitude to [-85, 85] (Web Mercator limit, Mapbox requirement)
  south = Math.max(-85, Math.min(85, south));
  north = Math.max(-85, Math.min(85, north));
  
  console.log(`📐 BBox (clamped): [${west}, ${south}, ${east}, ${north}]`);
  
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
  // Đảm bảo đã load danh sách timestamps
  if (ALL_AVAILABLE_TIMESTAMPS.length === 0) {
    await initializeTimestamps();
  }

  const availableTimestamps = calculateDisplayTimeRange();
  const windTimestamp = availableTimestamps.find(t => t.timestamp === timestamp);
  
  if (!windTimestamp) {
    throw new Error(`Timestamp ${timestamp} not found in available data`);
  }

  return loadWindDataFromTIFF(windTimestamp.uFile, windTimestamp.vFile);
}

/**
 * Get timestamp gần nhất với thời gian hiện tại (GMT+7)
 * Tìm file TIFF gần nhất với giờ hiện tại
 */
export async function getCurrentTimestamp(): Promise<string> {
  // Đảm bảo đã load danh sách timestamps
  if (ALL_AVAILABLE_TIMESTAMPS.length === 0) {
    await initializeTimestamps();
  }

  const availableTimestamps = calculateDisplayTimeRange();
  console.log(`🔢 Available timestamps for current time search: ${availableTimestamps.length}`);
  if (availableTimestamps.length === 0) {
    throw new Error('No TIFF files available');
  }

  // Lấy thời gian hiện tại GMT+7
  const nowGMT7 = getCurrentTimeGMT7();
  const currentTime = nowGMT7.getTime();

  // Tìm timestamp gần nhất với thời gian hiện tại
  let closest = availableTimestamps[0];
  let minDiff = Math.abs(currentTime - new Date(closest.timestamp.replace(' ', 'T')).getTime());

  for (const ts of availableTimestamps) {
    const tsTime = new Date(ts.timestamp.replace(' ', 'T')).getTime();
    const diff = Math.abs(currentTime - tsTime);
    
    if (diff < minDiff) {
      minDiff = diff;
      closest = ts;
    }
  }

  console.log(`🕐 Current time (GMT+7): ${nowGMT7.toISOString()}`);
  console.log(`📍 Closest timestamp: ${closest.timestamp}`);

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
      const origin = image.getOrigin();
      const resolution = image.getResolution();
      
      console.log(`📊 TIFF Metadata:`);
      console.log(`   Size: ${width}x${height}`);
      console.log(`   Origin: [${origin?.join(', ')}]`);
      console.log(`   Resolution: [${resolution?.join(', ')}]`);
      console.log(`   BBox (from TIFF): [${geoBbox?.join(', ')}]`);
      
      if (geoBbox && geoBbox.length === 4) {
        // bbox format from geotiff: [minX, minY, maxX, maxY] = [west, south, east, north]
        bbox = normalizeBbox([geoBbox[0], geoBbox[1], geoBbox[2], geoBbox[3]]);
        
        // Calculate and log pixel centers for debugging
        const pixelWidth = (geoBbox[2] - geoBbox[0]) / width;
        const pixelHeight = Math.abs((geoBbox[3] - geoBbox[1]) / height);
        const firstPixelCenterX = geoBbox[0] + pixelWidth / 2;
        const firstPixelCenterY = geoBbox[3] - pixelHeight / 2; // geoBbox[3] is maxY (north)
        
        console.log(`   Pixel size: ${pixelWidth}° x ${pixelHeight}°`);
        console.log(`   First pixel center: [${firstPixelCenterX}, ${firstPixelCenterY}]`);
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
      speed: new Float32Array(0),
      width: 0,
      height: 0,
      bbox: [-180, -85, 180, 85]
    };
  }
}

