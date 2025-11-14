# Windy Clone

Ứng dụng web hiển thị bản đồ thời tiết giống [Windy.com](https://windy.com), sử dụng Next.js, Mapbox GL và GeoServer.

## 🚀 Quick Start

**Muốn chạy ngay?** → Xem [QUICK_START.md](./QUICK_START.md)

## Tính năng

- 🗺️ Bản đồ tương tác với Mapbox GL JS
- 🎨 Giao diện tối màu giống Windy.com
- 🌬️ Hiển thị layer gió từ GeoServer (TIFF)
- ⚡ Next.js 16 với App Router
- 🎯 TypeScript support

## Cài đặt

### 1. Clone và cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env.local` với nội dung:

```bash
# Mapbox Access Token (bắt buộc)
# Lấy token tại: https://account.mapbox.com/access-tokens/
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# GeoServer Configuration (tùy chọn)
NEXT_PUBLIC_GEOSERVER_URL=http://localhost:8080/geoserver/wms
NEXT_PUBLIC_GEOSERVER_WORKSPACE=your_workspace
NEXT_PUBLIC_GEOSERVER_WIND_LAYER=wind_data
```

### 3. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong browser.

## Cấu hình GeoServer

Xem hướng dẫn chi tiết trong file [GEOSERVER_SETUP.md](./GEOSERVER_SETUP.md).

### Tóm tắt:
1. Cài đặt GeoServer
2. Upload file TIFF chứa dữ liệu gió
3. Publish layer trong GeoServer
4. Cập nhật URL và tên layer trong `.env.local`

## Cấu trúc dự án

```
windy-clone/
├── app/
│   ├── components/
│   │   └── Map.tsx           # Component bản đồ chính
│   ├── config/
│   │   └── geoserver.config.ts  # Cấu hình GeoServer
│   ├── page.tsx              # Trang chủ
│   └── globals.css           # Global styles
├── public/                   # Static files
├── .env.local               # Biến môi trường (tạo mới)
└── package.json
```

## Công nghệ sử dụng

- **Next.js 16** - React framework
- **Mapbox GL JS** - Interactive maps
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **GeoServer** - Geospatial data server

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
