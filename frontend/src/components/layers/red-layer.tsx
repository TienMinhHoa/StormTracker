"use client"

import dynamic from "next/dynamic"
const Polygon = dynamic(() => import("react-leaflet").then(mod => mod.Polygon), { ssr: false })

export default function RedLayer() {
  return (
    <Polygon
      positions={[
        [10, 105],
        [10, 115],
        [20, 115],
        [20, 105],
      ]}
      pathOptions={{
        color: "red",
        weight: 2,
        fillOpacity: 0.25,
      }}
    />
  )
}
