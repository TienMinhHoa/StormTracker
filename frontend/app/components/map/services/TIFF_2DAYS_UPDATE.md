# TIFF Service - Cập nhật lọc 2 ngày (Hôm nay + Hôm qua)

## Thay đổi chính

### 1. Quét chỉ 2 ngày thay vì 7 ngày
- API call: `/api/tiff/scan?days=2` (thay vì `days=7`)
- Quét: Ngày hôm nay + Ngày hôm qua (theo GMT+7)

### 2. Lọc timestamps theo khoảng thời gian
- **Bắt đầu**: 00:00:00 ngày hôm qua
- **Kết thúc**: 23:59:59 ngày hôm nay
- Tất cả tính theo múi giờ GMT+7

### 3. Ví dụ

Nếu hôm nay là **28/11/2025**, service sẽ load:
- ✅ Ngày 27/11/2025: 00:00 → 23:00 (24 timestamps)
- ✅ Ngày 28/11/2025: 00:00 → 23:00 (24 timestamps)
- ❌ Ngày 26/11/2025 và trước đó: **không load**

**Tổng**: ~48 timestamps (nếu có đủ data mỗi giờ)

## Code đã sửa

### `tiffService.ts`

```typescript
// Trước: Quét 7 ngày
const response = await fetch('/api/tiff/scan?days=7');

// Sau: Quét 2 ngày
const response = await fetch('/api/tiff/scan?days=2');
```

```typescript
// Trước: Lọc 5 ngày gần nhất
const fiveDaysAgo = new Date(lastDate.getTime() - (5 * 24 * 60 * 60 * 1000));

// Sau: Lọc hôm nay + hôm qua
const yesterdayStart = new Date(nowGMT7);
yesterdayStart.setDate(yesterdayStart.getDate() - 1);
yesterdayStart.setHours(0, 0, 0, 0);
```

## Lợi ích

1. **Hiệu suất**: Load ít data hơn (48 timestamps thay vì ~168)
2. **Tập trung**: Chỉ hiển thị data gần đây nhất
3. **Real-time**: Luôn có data của hôm nay
4. **GMT+7**: Đồng bộ với múi giờ Việt Nam

## Test

```typescript
// Test xem có đúng 2 ngày không
const timestamps = await getAvailableTimestamps();
console.log(`Số timestamps: ${timestamps.length}`); // Expected: ~48

// Kiểm tra ngày đầu tiên và cuối cùng
console.log(`First: ${timestamps[0].timestamp}`);    // Expected: Yesterday 00:00
console.log(`Last: ${timestamps[timestamps.length - 1].timestamp}`); // Expected: Today 23:00
```

## Cách sử dụng

Không có thay đổi gì về API sử dụng, chỉ cần gọi như cũ:

```typescript
import { initializeTimestamps, getCurrentTimestamp } from './tiffService';

// Khởi tạo (sẽ tự động load 2 ngày)
await initializeTimestamps();

// Lấy timestamp hiện tại
const current = await getCurrentTimestamp();
```

---

**Cập nhật**: 28/11/2025  
**Lý do**: Tối ưu performance và tập trung vào data gần đây
