# Cập nhật TimeControls: Thêm nút Previous/Next & Bắt đầu từ thời gian hiện tại

## Tổng quan thay đổi

### 1. Thêm nút điều hướng Previous/Next
- **Nút Previous (◀)**: Quay lại timestamp trước đó
- **Nút Play/Pause (▶/⏸)**: Giữ nguyên để auto-play
- **Nút Next (▶)**: Tiến tới timestamp tiếp theo
- Các nút tự động disable khi ở đầu/cuối danh sách

### 2. Bắt đầu từ thời gian hiện tại (GMT+7)
- Khi load trang, tự động tìm và hiển thị timestamp gần nhất với giờ hiện tại
- Sử dụng `getCurrentTimestamp()` từ tiffService
- Fallback về timestamp đầu tiên nếu có lỗi

## Files đã sửa

### 1. `TimeControls.tsx`
**Thêm:**
- Hàm `handlePrevious()`: Chuyển về timestamp trước
- Hàm `handleNext()`: Chuyển tới timestamp sau
- States `isFirstTimestamp` và `isLastTimestamp` để disable buttons
- 2 nút Previous/Next với icons SVG

**UI Layout mới:**
```
[◀] [▶/⏸] [▶] ==================== [Slider] ====================
```

### 2. `Map.tsx`
**Thêm:**
- Import `getCurrentTimestamp` và `initializeTimestamps`
- Logic khởi tạo với timestamp hiện tại trong useEffect
- Async function `initializeCurrentTimestamp()` để load timestamp GMT+7

**Trước:**
```typescript
useEffect(() => {
  if (!windTimestamp && AVAILABLE_TIMESTAMPS.length > 0) {
    setWindTimestamp(AVAILABLE_TIMESTAMPS[0].timestamp); // Luôn bắt đầu từ đầu
  }
}, []);
```

**Sau:**
```typescript
useEffect(() => {
  const initializeCurrentTimestamp = async () => {
    if (!windTimestamp) {
      try {
        await initializeTimestamps();
        const currentTimestamp = await getCurrentTimestamp(); // GMT+7
        setWindTimestamp(currentTimestamp);
      } catch (error) {
        // Fallback
        if (AVAILABLE_TIMESTAMPS.length > 0) {
          setWindTimestamp(AVAILABLE_TIMESTAMPS[0].timestamp);
        }
      }
    }
  };
  initializeCurrentTimestamp();
}, []);
```

### 3. `MapControls.tsx`
**Đã cập nhật trước đó:**
- Thay thế slider bằng 2 nút Previous/Next
- Hiển thị timestamp hiện tại ở giữa
- Không còn dùng slider nữa

## Tính năng chính

### 1. Navigation với keyboard (có thể thêm sau)
```typescript
// Future enhancement
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === ' ') handlePlayPause();
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [handlePrevious, handleNext, handlePlayPause]);
```

### 2. Timestamp hiện tại theo GMT+7
- Tự động tìm file TIFF gần nhất với giờ hiện tại
- Ví dụ: Nếu bây giờ là 14:30 GMT+7, sẽ load file `20251128_1400.tif`

### 3. Disable logic
- Previous disabled khi ở timestamp đầu tiên
- Next disabled khi ở timestamp cuối cùng  
- Tất cả buttons disabled khi không có data

## UX Flow

1. **User mở app** → Tự động load timestamp hiện tại (GMT+7)
2. **User click Previous** → Xem data giờ trước
3. **User click Next** → Xem data giờ sau
4. **User click Play** → Auto-play qua các timestamps (mỗi 2s)
5. **User click Pause** → Dừng auto-play

## Ví dụ

**Hôm nay 28/11/2025, 14:30 GMT+7:**

```
Initial load:
  → Timestamp: "2025-11-28 14:00"

Click Previous:
  → Timestamp: "2025-11-28 13:00"

Click Next x2:
  → Timestamp: "2025-11-28 15:00"

Click Play:
  → Auto: 15:00 → 16:00 → 17:00 → ...
```

## Testing

```bash
# 1. Mở browser console
# 2. Xem logs:
🕐 Initialized with current timestamp: 2025-11-28 14:00
📋 Found 48 available timestamps

# 3. Test buttons:
- Click Previous → Should go back 1 hour
- Click Next → Should go forward 1 hour
- First timestamp → Previous disabled
- Last timestamp → Next disabled
```

## Notes

- Slider vẫn còn để user có thể jump nhanh giữa các timestamps
- Play/Pause vẫn giữ nguyên tính năng auto-play
- Previous/Next cho phép control từng bước chi tiết hơn
- Timestamp hiện tại luôn là gần nhất với giờ GMT+7

---

**Cập nhật**: 28/11/2025  
**Tác giả**: StormTracker Dev Team
