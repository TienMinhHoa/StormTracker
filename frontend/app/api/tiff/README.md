# TIFF Real-time Service - GMT+7

## Tóm tắt

Service tự động quét và load ảnh TIFF từ thư mục local `/home/geoai/hoa/GFS_process` theo thời gian thực GMT+7.

## Files đã tạo/cập nhật

### Backend API Routes
1. **`/app/api/tiff/scan/route.ts`** - API quét thư mục và trả về danh sách file
2. **`/app/api/tiff/file/route.ts`** - API serve TIFF files từ local filesystem

### Frontend Service
3. **`/app/components/map/services/tiffService.ts`** - Service load và xử lý TIFF data

### Documentation
4. **`/app/components/map/services/TIFF_REALTIME_GUIDE.md`** - Hướng dẫn chi tiết
5. **`/app/components/map/services/test-tiff-service.ts`** - Script test

## Cách sử dụng nhanh

```typescript
import { 
  initializeTimestamps, 
  getCurrentTimestamp,
  loadWindDataForTimestamp 
} from './services/tiffService';

// Trong React component
useEffect(() => {
  async function loadData() {
    // Khởi tạo
    await initializeTimestamps();
    
    // Lấy timestamp hiện tại (GMT+7)
    const currentTime = await getCurrentTimestamp();
    
    // Load wind data
    const windData = await loadWindDataForTimestamp(currentTime);
  }
  
  loadData();
}, []);
```

## API Endpoints

- **GET** `/api/tiff/scan?days=7` - Quét và lấy danh sách timestamps
- **GET** `/api/tiff/file?component=u&year=2025&month=11&day=28&file=...` - Lấy TIFF file

## Cấu trúc thư mục local

```
/home/geoai/hoa/GFS_process/
├── U/2025/11/28/
│   ├── 20251128_0000.tif
│   ├── 20251128_0100.tif
│   └── ...
└── V/2025/11/28/
    ├── 20251128_0000.tif
    └── ...
```

## Features

- ✅ Tự động quét 7 ngày gần nhất
- ✅ Thời gian theo GMT+7 (múi giờ Việt Nam)
- ✅ Cache 5 phút để tối ưu performance
- ✅ Hiển thị 5 ngày gần nhất trên timeline
- ✅ Real-time update theo giờ hiện tại
- ✅ Đọc trực tiếp từ local filesystem (không cần public folder)

## Xem thêm

- Chi tiết: `TIFF_REALTIME_GUIDE.md`
- Test: `test-tiff-service.ts`
