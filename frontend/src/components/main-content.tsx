"use client"

import { Search, MapPin } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import type L from "leaflet"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const RedLayer = dynamic(() => import("./layers/red-layer"), { ssr: false })
const BlueLayer = dynamic(() => import("./layers/blue-layer"), { ssr: false })
const LayerControlPanel = dynamic(() => import("./layer-control-panels"), { ssr: false })
import { mockRescueRequests } from "./mock-data";
const HeatmapLayer = dynamic(() => import("./layers/heatmap-layer"), { ssr: false });
import { computeHeatmapFromRescueData, HeatPoint } from "./heatmap-utils";
// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-secondary">
      <div className="text-muted-foreground">Đang tải bản đồ...</div>
    </div>
  ),
})

const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
})

const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
})

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
})

const ZoomControl = dynamic(() => import("react-leaflet").then((mod) => mod.ZoomControl), {
  ssr: false,
})


// Create custom storm icons
const createStormIcon = (level: string) => {
  if (typeof window === "undefined") return undefined

  const L = require("leaflet")
  
  // Determine color based on storm level
  const getColor = (lvl: string) => {
    const levelNum = parseInt(lvl.replace(/\D/g, ""))
    if (levelNum >= 8) return "#dc2626" // Red for strong storms
    if (levelNum >= 5) return "#ea580c" // Orange for medium storms
    return "#f59e0b" // Yellow for weak storms
  }

  const color = getColor(level)
  
  const svgIcon = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <!-- Outer glow -->
      <circle cx="20" cy="20" r="18" fill="${color}" opacity="0.3"/>
      <circle cx="20" cy="20" r="14" fill="${color}" opacity="0.5"/>
      <!-- Main icon -->
      <circle cx="20" cy="20" r="10" fill="${color}" filter="url(#shadow)"/>
      <!-- Storm spiral -->
      <path d="M 20 12 Q 24 14 25 18 Q 26 22 23 25 Q 20 27 16 25 Q 13 23 13 20 Q 13 17 15 15" 
            stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Center dot -->
      <circle cx="20" cy="20" r="3" fill="white" opacity="0.8"/>
    </svg>
  `

  return L.divIcon({
    html: svgIcon,
    className: "custom-storm-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  })
}

const getSeverityIcon = (severity: number) => {
 
  if (typeof window === "undefined") return undefined;

  const L = require("leaflet");
  const color = 'rgba(249, 254, 251, 1)'
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          text-align: center;
          line-height: 20px;
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">!</div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};
export default function MainContent() {
  const [mapCenter, setMapCenter] = useState<[number, number]>([16.0544, 108.2022]) // Vietnam center
  const [mapZoom, setMapZoom] = useState(6)
  const [stormIcons, setStormIcons] = useState<Map<number, L.DivIcon>>(new Map())
  const [openLayerPanel, setOpenLayerPanel] = useState(false)

  const [layers, setLayers] = useState([
  { key: "red", label: "Red Zone", visible: false },
  { key: "blue", label: "Blue Zone", visible: false },
  { key: "heatmap", label: "Heatmap", visible: false },
])
  const [heatmapData, setHeatmapData] = useState<HeatPoint[]>([]);

  const toggleLayer = (key: string) => {
  setLayers(prev =>
    prev.map(l =>
      l.key === key ? { ...l, visible: !l.visible } : l
    )
  )
}

  // Compute heatmap data from mock rescue requests
   useEffect(() => {
    const processed = computeHeatmapFromRescueData(mockRescueRequests);
    setHeatmapData(processed);
  }, []);

  // Sample storm locations
  const storms = useMemo(
    () => [
      { id: 1, name: "Vùng áp thấp nhiệt đới", position: [16.0, 115.0] as [number, number], level: "Mức 3" }
      // { id: 2, name: "Bão số 4", position: [18.2, 112.8] as [number, number], level: "Mức 10" },
    ],
    []
  )

  // Create icons on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const icons = new Map<number, L.DivIcon>()
      storms.forEach((storm) => {
        const icon = createStormIcon(storm.level)
        if (icon) icons.set(storm.id, icon)
      })
      setStormIcons(icons)
    }
  }, [storms])

  return (
    <main className="flex-1 overflow-hidden flex flex-col bg-gradient-to-b from-card to-background">
      {/* Search Bar and Controls */}
      <div className="p-6 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for a location"
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Layers Button */}
        <button  onClick={() => setOpenLayerPanel(v => !v)}
        className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12.586L5.707 8.293a1 1 0 10-1.414 1.414l6 6a1 1 0 001.414 0l6-6a1 1 0 10-1.414-1.414L10 12.586z" />
          </svg>
          Layers
        </button>
      </div>

      
      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden mx-6 mb-6 rounded-lg border border-border">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          zoomControl={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
           {/* Hiển thị các marker từ mockRescueRequests */}
          {mockRescueRequests.map((point, idx) => (
            <Marker
              key={idx}
              position={[point.lat, point.lng]}
              icon ={getSeverityIcon(point.severity)}
            >
              <Popup>
                <div>
                  <p style={{ color: "black" }}><strong>Severity:</strong> {point.severity}</p>
                  <p style = {{color: "black"}}><strong>Timestamp:</strong> {new Date(point.timestamp * 1000).toLocaleString()}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          <ZoomControl position="bottomright" />

          {/* Storm markers */}
          {storms.map((storm) => {
            const icon = stormIcons.get(storm.id)
            return (
              <Marker key={storm.id} position={storm.position} icon={icon}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-sm mb-1">{storm.name}</h3>
                    <p className="text-xs text-muted-foreground">Cấp độ: {storm.level}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vị trí: {storm.position[0].toFixed(2)}°N, {storm.position[1].toFixed(2)}°E
                    </p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
          {/* Conditional Layers */}
          {layers.find((l) => l.key === "red")?.visible && <RedLayer />}
          {layers.find((l) => l.key === "blue")?.visible && <BlueLayer />}
          {layers.find((l) => l.key === "heatmap")?.visible && <HeatmapLayer data={heatmapData} />}
        </MapContainer>
        {/* Layer Control Panel */}
       {openLayerPanel && (
  <LayerControlPanel layers={layers} onToggle={toggleLayer} />
)}
      </div>
    </main>
  )
}
