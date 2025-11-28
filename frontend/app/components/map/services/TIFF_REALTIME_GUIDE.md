# Hướng dẫn sử dụng TIFF Service với Real-time GMT+7

## Tổng quan

Service `tiffService.ts` đã được cập nhật để tự động quét và load ảnh TIFF theo thời gian thực GMT+7 từ thư mục local `/home/geoai/hoa/GFS_process`.

**Kiến trúc:**
- Frontend: `tiffService.ts` - Service để load và xử lý TIFF data
- Backend API: `/api/tiff/scan` - Quét thư mục và trả về danh sách files
- Backend API: `/api/tiff/file` - Serve TIFF files từ local filesystem

## Cấu trúc thư mục (Local)

```
/home/geoai/hoa/GFS_process/
├── U/
│   └── 2025/
│       └── 11/
│           ├── 20/
│           │   ├── 20251120_0000.tif
│           │   ├── 20251120_0100.tif
│           │   └── ...
│           ├── 21/
│           └── ...
└── V/
    └── (cùng cấu trúc với U)
```

**Naming convention:** `yyyymmdd_hhmm.tif` (ví dụ: `20251128_1430.tif`)

## Các tính năng mới

### 1. Quét thư mục tự động qua API
- API `/api/tiff/scan` quét thư mục local `/home/geoai/hoa/GFS_process`
- Tự động tìm file TIFF có sẵn trong 7 ngày gần nhất (GMT+7)
- Cache kết quả trong 5 phút để tối ưu performance
- File được serve qua API `/api/tiff/file` (không cần copy vào public folder)

### 2. Thời gian GMT+7
- Tất cả logic thời gian sử dụng GMT+7 (múi giờ Việt Nam)
- Tự động tìm file TIFF gần nhất với thời gian hiện tại
- Hỗ trợ real-time update theo giờ Việt Nam

### 3. Hiển thị 5 ngày gần nhất
- Tự động lọc và hiển thị dữ liệu của 5 ngày gần nhất
- Nếu tổng dữ liệu < 5 ngày thì hiển thị tất cả

### 4. Local filesystem access
- File TIFF được lưu trữ ở `/home/geoai/hoa/GFS_process` (không trong public folder)
- Next.js API routes đọc trực tiếp từ filesystem
- Bảo mật: Validate path để tránh directory traversal

## Sử dụng trong Component

### Khởi tạo khi component mount

```typescript
import { 
  initializeTimestamps, 
  getAvailableTimestamps,
  getCurrentTimestamp,
  loadWindDataForTimestamp,
  getCurrentTimeGMT7,
  refreshTimestamps
} from './services/tiffService';

// Trong React component
useEffect(() => {
  async function loadData() {
    // Khởi tạo danh sách timestamps
    await initializeTimestamps();
    
    // Hoặc lấy timestamps để hiển thị (5 ngày gần nhất)
    const timestamps = await getAvailableTimestamps();
    console.log('Available timestamps:', timestamps);
    
    // Lấy timestamp hiện tại (gần nhất với giờ hiện tại GMT+7)
    const currentTime = await getCurrentTimestamp();
    console.log('Current timestamp:', currentTime);
    
    // Load wind data cho timestamp hiện tại
    const windData = await loadWindDataForTimestamp(currentTime);
    console.log('Wind data loaded:', windData);
  }
  
  loadData();
}, []);
```

### Refresh dữ liệu định kỳ

```typescript
// Refresh mỗi 5 phút để check file mới
useEffect(() => {
  const interval = setInterval(async () => {
    console.log('🔄 Refreshing TIFF file list...');
    const timestamps = await refreshTimestamps();
    
    // Load lại wind data cho timestamp hiện tại
    const currentTime = await getCurrentTimestamp();
    const windData = await loadWindDataForTimestamp(currentTime);
    
    // Cập nhật state
    setWindData(windData);
  }, 5 * 60 * 1000); // 5 phút
  
  return () => clearInterval(interval);
}, []);
```

### Lấy thời gian GMT+7

```typescript
// Lấy thời gian hiện tại theo GMT+7
const currentTime = getCurrentTimeGMT7();
console.log('Current time (GMT+7):', currentTime.toISOString());
```

## Backend API Endpoints

### `GET /api/tiff/scan?days=7`
Quét thư mục local và trả về danh sách timestamps có sẵn.

**Query Parameters:**
- `days` (optional): Số ngày cần quét (default: 7)

**Response:**
```json
{
  "success": true,
  "count": 168,
  "timestamps": [
    {
      "timestamp": "2025-11-22 00:00",
      "uFile": "/api/tiff/file?component=u&year=2025&month=11&day=22&file=20251122_0000.tif",
      "vFile": "/api/tiff/file?component=v&year=2025&month=11&day=22&file=20251122_0000.tif"
    },
    ...
  ]
}
```

### `GET /api/tiff/file`
Serve TIFF file từ local filesystem.

**Query Parameters:**
- `component`: "u" hoặc "v"
- `year`: Năm (ví dụ: "2025")
- `month`: Tháng (ví dụ: "11")
- `day`: Ngày (ví dụ: "28")
- `file`: Tên file (ví dụ: "20251128_1430.tif")

**Response:** Binary TIFF file (Content-Type: image/tiff)

**Example:**
```
/api/tiff/file?component=u&year=2025&month=11&day=28&file=20251128_1430.tif
```

## Frontend API Functions

### `initializeTimestamps(): Promise<WindTimestamp[]>`
Khởi tạo và load danh sách tất cả timestamps có sẵn (7 ngày gần nhất).

**Returns:** Mảng tất cả timestamps có sẵn

### `getAvailableTimestamps(): Promise<WindTimestamp[]>`
Lấy danh sách timestamps để hiển thị (5 ngày gần nhất).

**Returns:** Mảng timestamps cho 5 ngày gần nhất

### `getCurrentTimestamp(): Promise<string>`
Lấy timestamp gần nhất với thời gian hiện tại (GMT+7).

**Returns:** String timestamp theo format "YYYY-MM-DD HH:MM"

### `loadWindDataForTimestamp(timestamp: string): Promise<TIFFWindData>`
Load wind data cho một timestamp cụ thể.

**Parameters:**
- `timestamp`: String timestamp theo format "YYYY-MM-DD HH:MM"

**Returns:** Object chứa wind data (u, v, speed, width, height, bbox)

### `getCurrentTimeGMT7(): Date`
Lấy thời gian hiện tại theo múi giờ GMT+7.

**Returns:** Date object theo GMT+7

### `refreshTimestamps(): Promise<WindTimestamp[]>`
Force refresh danh sách timestamps (xóa cache và quét lại).

**Returns:** Mảng timestamps mới

## Interface

### `WindTimestamp`
```typescript
interface WindTimestamp {
  timestamp: string;  // Format: "YYYY-MM-DD HH:MM"
  uFile: string;      // Path đến file U component
  vFile: string;      // Path đến file V component
}
```

### `TIFFWindData`
```typescript
interface TIFFWindData {
  u: Float32Array;        // U component (eastward wind)
  v: Float32Array;        // V component (northward wind)
  speed: Float32Array;    // Wind speed (calculated)
  width: number;          // Image width
  height: number;         // Image height
  bbox: [number, number, number, number]; // [west, south, east, north]
}
```

## Cache Strategy

- **Cache duration:** 5 phút
- **Cache scope:** Danh sách timestamps
- **Clear cache:** Tự động sau 5 phút hoặc gọi `refreshTimestamps()`

## Performance Tips

1. **Khởi tạo một lần:** Gọi `initializeTimestamps()` một lần khi component mount
2. **Sử dụng cache:** Không cần gọi lại liên tục, cache sẽ tự động hoạt động
3. **Refresh khi cần:** Chỉ gọi `refreshTimestamps()` khi cần kiểm tra file mới
4. **Lazy loading:** Wind data chỉ load khi cần, không load tất cả cùng lúc

## Troubleshooting

### Không tìm thấy file TIFF
```
Error: Timestamp 2025-11-28 14:00 not found in available data
```
**Giải pháp:** Kiểm tra file có tồn tại trong thư mục `/home/geoai/hoa/GFS_process`

### Cache không cập nhật
**Giải pháp:** Gọi `refreshTimestamps()` để force refresh cache

### Thời gian không đúng GMT+7
**Giải pháp:** Kiểm tra timezone của server, service tự động convert sang GMT+7

## Example: Complete Wind Map Component

```typescript
import React, { useEffect, useState } from 'react';
import {
  initializeTimestamps,
  getCurrentTimestamp,
  loadWindDataForTimestamp,
  getAvailableTimestamps,
  TIFFWindData,
  WindTimestamp
} from './services/tiffService';

export function WindMapComponent() {
  const [windData, setWindData] = useState<TIFFWindData | null>(null);
  const [timestamps, setTimestamps] = useState<WindTimestamp[]>([]);
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Khởi tạo khi mount
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        
        // Load timestamps
        const ts = await getAvailableTimestamps();
        setTimestamps(ts);
        
        // Load current timestamp
        const current = await getCurrentTimestamp();
        setCurrentTimestamp(current);
        
        // Load wind data
        const data = await loadWindDataForTimestamp(current);
        setWindData(data);
      } catch (error) {
        console.error('Error loading wind data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    init();
  }, []);

  // Auto refresh mỗi 5 phút
  useEffect(() => {
    const interval = setInterval(async () => {
      const current = await getCurrentTimestamp();
      if (current !== currentTimestamp) {
        const data = await loadWindDataForTimestamp(current);
        setWindData(data);
        setCurrentTimestamp(current);
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentTimestamp]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Wind Map - Real-time GMT+7</h2>
      <p>Current time: {currentTimestamp}</p>
      <p>Available timestamps: {timestamps.length}</p>
      {/* Render map with windData */}
    </div>
  );
}
```
