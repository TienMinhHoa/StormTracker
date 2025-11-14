// Cấu hình GeoServer
export const geoServerConfig = {
  // URL của GeoServer
  // Sử dụng proxy API để bypass CORS
  url: process.env.NEXT_PUBLIC_USE_GEOSERVER_PROXY === 'true' 
    ? '/api/geoserver'  // Dùng Next.js API proxy
    : (process.env.NEXT_PUBLIC_GEOSERVER_URL || 'http://localhost:8080/geoserver/wms'),
  
  // Tên workspace trong GeoServer
  workspace: process.env.NEXT_PUBLIC_GEOSERVER_WORKSPACE || 'ne',
  
  // Tên layer gió trong GeoServer  
  windLayer: process.env.NEXT_PUBLIC_GEOSERVER_WIND_LAYER || 'resample',
  
  // Cấu hình WMS
  wms: {
    version: '1.1.0',
    format: 'image/png',  // Mapbox chỉ hỗ trợ PNG, JPEG, WebP
    transparent: true,
    srs: 'EPSG:3857',
    tileSize: 256,
  },
  
  // Cấu hình hiển thị
  display: {
    opacity: 0.7,
    fadeDuration: 300,
  },

  // Enable/disable wind layer (useful for testing without GeoServer)
  enabled: true, // Tắt cho đến khi GeoServer sẵn sàng
};

// Hàm tạo URL cho WMS GetMap request
export const getWMSTileUrl = (layerName: string): string => {
  const { url, wms } = geoServerConfig;
  return `${url}?service=WMS&version=${wms.version}&request=GetMap&layers=${layerName}&bbox={bbox-epsg-3857}&width=${wms.tileSize}&height=${wms.tileSize}&srs=${wms.srs}&format=${wms.format}&transparent=${wms.transparent}`;
};

// Alternative: Public WMS servers for testing (OpenWeatherMap, etc.)
export const publicWeatherWMS = {
  // OpenWeatherMap Wind Speed layer (requires API key)
  openweathermap: (apiKey: string) => 
    `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`,
  
  // Example: Iowa Environmental Mesonet
  iem: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?',
};

// For testing without GeoServer, you can use these public services
export const usePublicWindLayer = () => {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  if (apiKey) {
    return publicWeatherWMS.openweathermap(apiKey);
  }
  return null;
};
