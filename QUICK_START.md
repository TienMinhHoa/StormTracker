# Quick Start Guide

## 🚀 Chạy ngay trong 2 phút

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Tạo file `.env.local`
Tạo file `.env.local` trong thư mục root với nội dung tối thiểu:

```bash
# BẮT BUỘC: Mapbox Token
# Lấy miễn phí tại: https://account.mapbox.com/access-tokens/
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here

# TÙY CHỌN: Tắt wind layer nếu chưa có GeoServer
NEXT_PUBLIC_GEOSERVER_ENABLED=false
```

### 3. Chạy development server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) 🎉

---

## 📝 Lấy Mapbox Token (Miễn phí)

1. Truy cập: https://account.mapbox.com/
2. Đăng ký/Đăng nhập (miễn phí)
3. Vào **Access Tokens**
4. Click **Create a token** hoặc copy token có sẵn
5. Paste vào `.env.local`

**Lưu ý**: Mapbox free tier cho phép 50,000 map loads/tháng miễn phí.

---

## 🎨 Các chế độ test

### Chế độ 1: Chỉ bản đồ (không có layer gió)
Phù hợp khi chưa có GeoServer setup.

```bash
# .env.local
NEXT_PUBLIC_MAPBOX_TOKEN=your_token
NEXT_PUBLIC_GEOSERVER_ENABLED=false
```

**Kết quả**: Bản đồ nền với style Windy, không có wind layer và controls.

### Chế độ 2: Với GeoServer local
Sau khi setup GeoServer (xem [GEOSERVER_SETUP.md](./GEOSERVER_SETUP.md)):

```bash
# .env.local
NEXT_PUBLIC_MAPBOX_TOKEN=your_token
NEXT_PUBLIC_GEOSERVER_ENABLED=true
NEXT_PUBLIC_GEOSERVER_URL=http://localhost:8080/geoserver/wms
NEXT_PUBLIC_GEOSERVER_WORKSPACE=your_workspace
NEXT_PUBLIC_GEOSERVER_WIND_LAYER=wind_layer_name
```

**Kết quả**: Bản đồ đầy đủ với wind layer từ GeoServer.

### Chế độ 3: Với public weather API (Optional)
Nếu có OpenWeatherMap API key:

```bash
# .env.local
NEXT_PUBLIC_MAPBOX_TOKEN=your_token
NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_openweathermap_key
```

*(Feature này cần implement thêm - xem roadmap)*

---

## ✨ Tính năng có sẵn

✅ Bản đồ tương tác với Mapbox GL  
✅ Style tối màu giống Windy.com  
✅ Zoom in/out, Pan  
✅ Hiển thị tọa độ & zoom level real-time  
✅ Layer controls (nếu có GeoServer)  
✅ Wind legend với color scale  
✅ Responsive UI  

---

## 🐛 Troubleshooting

### "Map failed to load"
- ❌ Chưa có `NEXT_PUBLIC_MAPBOX_TOKEN` trong `.env.local`
- ✅ Kiểm tra token đã đúng chưa
- ✅ Restart dev server sau khi thay đổi `.env.local`

### "Wind layer not showing"
- Đặt `NEXT_PUBLIC_GEOSERVER_ENABLED=false` nếu chưa có GeoServer
- Kiểm tra GeoServer có đang chạy không
- Xem console log trong browser (F12)

### "npm run dev" lỗi
```bash
# Xóa node_modules và reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Port 3000 đã được sử dụng
```bash
# Chạy trên port khác
npm run dev -- -p 3001
```

---

## 📂 Project Structure

```
windy-clone/
├── app/
│   ├── components/         # React components
│   │   ├── Map.tsx        # Main map component
│   │   ├── LayerControls.tsx
│   │   ├── WindLegend.tsx
│   │   └── MapInfo.tsx
│   ├── config/
│   │   └── geoserver.config.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/                # Static assets
├── .env.local            # Biến môi trường (TỰ TẠO)
├── package.json
└── README.md
```

---

## 🎯 Next Steps

### Nếu chưa có GeoServer:
1. ✅ Test bản đồ nền với `GEOSERVER_ENABLED=false`
2. 📖 Đọc [GEOSERVER_SETUP.md](./GEOSERVER_SETUP.md) để setup
3. 🌬️ Thêm wind layer sau khi có GeoServer

### Nếu đã có GeoServer:
1. ✅ Upload TIFF file lên GeoServer
2. ⚙️ Cấu hình layer trong GeoServer
3. 🔧 Update `.env.local` với thông tin GeoServer
4. 🎨 Customize style nếu cần

### Customize:
- Đổi màu sắc trong `Map.tsx`
- Thay đổi bounds & center
- Thêm custom layers
- Styling với Tailwind CSS

---

## 📚 Documentation

- [README.md](./README.md) - Overview & setup
- [GEOSERVER_SETUP.md](./GEOSERVER_SETUP.md) - Chi tiết setup GeoServer
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Tóm tắt implementation

---

## 💬 Tips

1. **Develop local first**: Test với GeoServer local trước khi deploy
2. **Console logs**: Mở F12 để xem logs từ map
3. **Hot reload**: File changes tự động reload
4. **Build test**: Chạy `npm run build` để check production build

---

## 🎉 Ready to go!

```bash
npm install
# Tạo .env.local với MAPBOX_TOKEN
npm run dev
# Open http://localhost:3000
```

Enjoy your Windy clone! 🌬️🗺️

