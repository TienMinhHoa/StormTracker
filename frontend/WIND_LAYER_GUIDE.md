# 🌪️ Wind Layer Implementation Guide

## Tổng quan

Hệ thống wind layer của chúng ta sử dụng **plotty** để render dữ liệu gió toàn cầu từ GFS (Global Forecast System) lên bản đồ Mapbox GL JS, giống như Windy.com.

## 🏗️ Kiến trúc

```
📊 GFS Data (GRIB2)
    ↓
🔄 Parse → U/V Components
    ↓
🧮 Calculate Wind Speed
    ↓
🎨 Plotty → Color Scale
    ↓
🗺️ Mapbox Raster Layer
```

## 📁 Files chính

### **Services:**
- `app/services/gfsService.ts` - Xử lý dữ liệu gió giả lập

### **Components:**
- `app/components/WindLayer.tsx` - Render wind layer
- `app/components/WindControls.tsx` - Controls UI
- `app/components/Map.tsx` - Tích hợp vào map

## 🎨 Cách sử dụng

### **1. Kích hoạt Wind Layer:**
```tsx
// Trong MapControls, tick vào "Wind Speed"
<MapControls onLayerToggle={handleLayerToggle} />
```

### **2. Điều khiển Wind Layer:**
```tsx
<WindControls
  enabled={windLayerEnabled}
  opacity={0.7}
  colorScale="jet"
  forecastHour={0}
  isLoading={false}
  onOpacityChange={setOpacity}
  onColorScaleChange={setColorScale}
  onForecastHourChange={setForecastHour}
/>
```

### **3. Render Wind Layer:**
```tsx
<WindLayer
  map={mapInstance}
  enabled={true}
  opacity={0.7}
  forecastHour={0}
  colorScale="jet"
/>
```

## 🎯 Color Scales có sẵn

| Scale | Mô tả | Range |
|-------|--------|--------|
| `jet` | Blue → Green → Yellow → Red | 0-30 m/s |
| `viridis` | Purple → Blue → Green → Yellow | 0-30 m/s |
| `rainbow` | Red → Orange → Yellow → Green → Blue → Purple | 0-30 m/s |
| `hot` | Black → Red → Yellow → White | 0-30 m/s |
| `cool` | Cyan → Magenta | 0-30 m/s |
| `turbo` | Improved rainbow | 0-30 m/s |
| `inferno` | Black → Purple → Red → Yellow | 0-30 m/s |
| `plasma` | Purple → Red → Yellow | 0-30 m/s |

## 🌍 Dữ liệu gió toàn cầu

### **Hiện tượng khí tượng được mô phỏng:**

1. **Hadley Cell Circulation** - Tuần hoàn Hadley (0°-30°N/S)
   - Trade winds: Đông → Tây ở nhiệt đới

2. **Ferrel Cell Circulation** - Tuần hoàn Ferrel (30°-60°N/S)
   - Westerlies: Tây → Đông ở vùng ôn đới
   - Jet streams ở 45°-55°

3. **Polar Cell Circulation** - Tuần hoàn cực (60°-90°N/S)
   - Polar easterlies: Đông → Tây ở vùng cực
   - Polar vortex effects

4. **Monsoon Effects** - Hiệu ứng gió mùa
   - Indian Ocean monsoon patterns

5. **Oceanic Effects** - Ảnh hưởng đại dương
   - Gió mạnh hơn trên biển, yếu hơn trên đất

6. **Seasonal Variations** - Biến động theo mùa
   - Khác nhau giữa Northern/Southern Hemisphere

7. **Terrain Effects** - Ảnh hưởng địa hình
   - Giảm tốc độ gió ở vùng núi (Himalayas, Rockies, Alps, Andes)

### **Độ phân giải:**
- **Width:** 1440 pixels (360° / 0.25°)
- **Height:** 721 pixels (180° / 0.25° + 1)
- **Coverage:** Toàn cầu (-180° đến 180°, -90° đến 90°)

## 🔧 Controls

### **Opacity Slider:**
- Range: 0% - 100%
- Default: 70%

### **Forecast Hour Slider:**
- Range: 0h - 168h (7 days)
- Step: 6 hours
- Mô phỏng dự báo thời tiết

### **Color Scale Selector:**
- 8 color schemes
- Real-time preview bar
- Smooth transitions

## 🚀 Performance

### **Optimization:**
- **WebGL Rendering** via plotty
- **Canvas-based** texture generation
- **Lazy loading** của dữ liệu
- **Memory cleanup** khi unmount

### **File sizes:**
- `plotty.min.js`: ~20KB
- Wind data: ~8MB (Float32Array 1440x721x4)
- Texture: ~5MB (WebGL)

## 🔄 Workflow thực tế

### **Với dữ liệu GFS thật:**

1. **Fetch từ NOAA NOMADS:**
   ```bash
   curl "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t00z.pgrb2.0p25.f000&lev_10_m_above_ground=on&var_UGRD=on&var_VGRD=on"
   ```

2. **Parse GRIB2:**
   ```javascript
   // Sử dụng eccodes hoặc grib2js
   const grib = new GRIB2Parser(buffer);
   const uData = grib.getVariable('UGRD');
   const vData = grib.getVariable('VGRD');
   ```

3. **Calculate Wind Speed:**
   ```javascript
   const speed = new Float32Array(uData.length);
   for (let i = 0; i < uData.length; i++) {
     speed[i] = Math.sqrt(uData[i]*uData[i] + vData[i]*vData[i]);
   }
   ```

4. **Feed vào Plotty:**
   ```javascript
   const plot = new plotty.plot({
     canvas: canvas,
     data: speed,
     width: 1440,
     height: 721,
     domain: [0, 50],
     colorScale: 'jet'
   });
   ```

## 🎨 Customization

### **Thêm Color Scale mới:**
```javascript
plotty.addColorScale("myScale", ["#000000", "#ff0000", "#ffff00"], [0, 0.5, 1]);
```

### **Tùy chỉnh Domain:**
```javascript
domain: [0, 40] // 0-40 m/s range
```

### **Clamp Values:**
```javascript
clampLow: true,
clampHigh: true
```

## 🐛 Troubleshooting

### **Common Issues:**

1. **Canvas too large:**
   - Mapbox có giới hạn texture size
   - Giảm resolution hoặc chia thành tiles

2. **Memory leaks:**
   - Cleanup map sources/layers khi unmount
   - Dispose canvas elements

3. **Performance:**
   - Debounce controls changes
   - Use WebWorkers cho calculations nặng

## 📊 Monitoring

### **Debug Info:**
- Console logs cho loading states
- Performance metrics
- Memory usage tracking

### **Error Handling:**
- Fallback to static data
- Retry mechanisms
- User-friendly error messages

## 🔮 Future Enhancements

1. **Real GFS Integration** - Backend API
2. **Wind Animation** - Particle systems
3. **Multiple Levels** - 850hPa, 500hPa, etc.
4. **Isobars** - Pressure contours
5. **Interactive Legends** - Clickable wind speeds

---

## 🎯 Demo

Chạy app và:
1. Vào **Layers** → Check **"Wind Speed"**
2. Thử các **color scales** khác nhau
3. Điều chỉnh **opacity** và **forecast hours**
4. Quan sát dữ liệu gió toàn cầu được render real-time!

🌪️ **Wind layer của bạn đã sẵn sàng!** 🗺️✨
