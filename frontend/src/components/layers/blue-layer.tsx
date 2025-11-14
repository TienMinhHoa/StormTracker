"use client"

import dynamic from "next/dynamic"
const Polygon = dynamic(() => import("react-leaflet").then(mod => mod.Polygon), { ssr: false })

export default function BlueLayer() {
  return (
    <Polygon
      positions={[
        [8, 105],
        [8, 110],
        [12, 110],
        [12, 105],
      ]}
      pathOptions={{
        color: "blue",
        weight: 2,
        fillOpacity: 0.25,
      }}
    />
  )
}
