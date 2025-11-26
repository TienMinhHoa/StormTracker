# Hướng dẫn Test Tính năng Dự báo Bão

## Các thay đổi đã thực hiện

### 1. Backend (đã có sẵn)

- ✅ API endpoint: `/api/v1/forecasts/storm/{storm_id}/latest`
- ✅ Model: `Forecast` với các trường `nchmf` và `jtwc` (JSON)
- ✅ CRUD operations trong `forecasts/router.py` và `forecasts/service.py`

### 2. Frontend (mới thêm)

#### A. Service API (`app/services/forecastApi.ts`)

- Tạo các function để fetch dữ liệu forecast từ backend
- `getLatestForecast(stormId)` - Lấy dự báo mới nhất của bão
- `getForecastsByStorm(stormId)` - Lấy tất cả dự báo của bão

#### B. Component mới (`app/components/forecast/StormForecast.tsx`)

- Component hiển thị dự báo bão với khả năng toggle giữa 2 nguồn:
  - 🇻🇳 **NCHMF** (Trung tâm Khí tượng Thủy văn Quốc gia)
  - 🌏 **JTWC** (Joint Typhoon Warning Center)
- Hiển thị:
  - Tình hình hiện tại (vị trí, sức gió, hướng di chuyển)
  - Dự báo 24h, 48h, 72h
  - Vùng nguy hiểm (danger zone)
  - Xu hướng dài hạn (72-120h)

#### C. Tích hợp vào ForecastTab

- Thêm component `StormForecast` vào đầu tab "Dự báo & Cảnh báo bão"
- Component tự động load dữ liệu khi có `stormId`

## Cách Test

### Bước 1: Insert dữ liệu mẫu vào Database

```powershell
cd D:\pypy\Procon\StormTracker\backend
.\.venv\Scripts\Activate.ps1
python insert_forecast_sample.py
```

Script này sẽ tạo/update dữ liệu forecast cho `storm_id = "NOWLIVE1234"` với:

- Dữ liệu NCHMF (Tiếng Việt)
- Dữ liệu JTWC (Tiếng Anh)

### Bước 2: Khởi động Backend

```powershell
cd D:\pypy\Procon\StormTracker\backend
.\.venv\Scripts\Activate.ps1
uvicorn src.main:app --reload
```

### Bước 3: Khởi động Frontend

```powershell
cd D:\pypy\Procon\StormTracker\frontend
npm run dev
```

### Bước 4: Test trên Browser

1. Mở ứng dụng: http://localhost:3000
2. Chọn bão có `storm_id = "NOWLIVE1234"` (hoặc storm đang active)
3. Mở tab "Dự báo & Cảnh báo"
4. Phần "Dự báo Bão" sẽ hiển thị ở đầu tab
5. Click toggle giữa **NCHMF** và **JTWC** để xem dữ liệu từ 2 nguồn

## Kiểm tra API trực tiếp

### Test API endpoint:

```bash
curl http://localhost:8000/api/v1/forecasts/storm/NOWLIVE1234/latest
```

Response sẽ có dạng:

```json
{
  "forecast_id": 1,
  "storm_id": "NOWLIVE1234",
  "nchmf": {
    "current": { ... },
    "forecast": [ ... ],
    "long_range": { ... }
  },
  "jtwc": {
    "current": { ... },
    "forecast": [ ... ],
    "long_range": { ... }
  },
  "created_at": "2024-11-26T..."
}
```

## Cấu trúc dữ liệu

### Format JSON cho NCHMF/JTWC:

```json
{
  "current": {
    "time": "2024-11-26 13:00",
    "position": { "lat": 12.4, "lon": 116.6 },
    "intensity": { "wind": 9, "gust": 11 },
    "movement": { "direction": "Tây Tây Bắc", "speed_kmh": 20 },
    "risk_level": null
  },
  "forecast": [
    {
      "time": "2024-11-27 13:00",
      "position": { "lat": 12.7, "lon": 114.1 },
      "intensity": { "wind": 11, "gust": 14 },
      "movement": { "direction": "Tây Tây Bắc", "speed_kmh": 10 },
      "danger_zone": {
        "lat_range": [11.0, 15.0],
        "lon_range": [112.0, 118.5]
      },
      "risk_level": 3
    }
  ],
  "long_range": {
    "time_range": "72-120h",
    "movement": { "direction": "Bắc Tây Bắc", "speed_kmh": "3-5" },
    "intensity_trend": "Suy yếu dần"
  }
}
```

## Troubleshooting

### Lỗi không hiển thị dữ liệu:

1. Kiểm tra backend đang chạy: http://localhost:8000/health
2. Kiểm tra API trả về dữ liệu: http://localhost:8000/api/v1/forecasts/storm/NOWLIVE1234/latest
3. Kiểm tra console browser (F12) xem có lỗi fetch không
4. Kiểm tra biến môi trường `NEXT_PUBLIC_API_URL` trong `.env.local`

### Lỗi khi insert dữ liệu:

1. Đảm bảo storm `NOWLIVE1234` đã tồn tại trong bảng `storms`
2. Nếu chưa có, tạo storm trước:

```sql
INSERT INTO storms (storm_id, name, start_date)
VALUES ('NOWLIVE1234', 'Live Storm', '2024-11-26 00:00:00');
```

## Tính năng

✅ Toggle giữa 2 nguồn dữ liệu (NCHMF/JTWC)  
✅ Hiển thị tình hình hiện tại  
✅ Dự báo theo timeline (24h, 48h, 72h)  
✅ Vùng nguy hiểm với tọa độ lat/lon  
✅ Mức độ nguy hiểm (risk level) với màu sắc  
✅ Xu hướng dài hạn  
✅ Responsive design  
✅ Loading và error states

## Files đã tạo/sửa

### Tạo mới:

- `frontend/app/services/forecastApi.ts`
- `frontend/app/components/forecast/StormForecast.tsx`
- `backend/insert_forecast_sample.py`

### Sửa đổi:

- `frontend/app/components/forecast/index.ts`
- `frontend/app/components/forecast/ForecastTab.tsx`
