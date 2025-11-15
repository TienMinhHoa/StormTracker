"use client"

interface LayerItem {
  key: string
  label: string
  visible: boolean
}

interface LayerControlProps {
  layers: LayerItem[]
  onToggle: (key: string) => void
}

export default function LayerControlPanel({ layers, onToggle }: LayerControlProps) {
  return (
    <div className="absolute top-4 right-4 bg-card border border-border rounded-xl p-4 shadow-xl w-48 z-[9999]">
      <h3 className="font-semibold text-sm mb-2">Layers</h3>

      {layers.map((layer) => (
        <label key={layer.key} className="flex items-center gap-2 mb-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={layer.visible}
            onChange={() => onToggle(layer.key)}
          />
          {layer.label}
        </label>
      ))}
    </div>
  )
}
