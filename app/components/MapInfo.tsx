'use client';

interface MapInfoProps {
  lat: number;
  lng: number;
  zoom: number;
}

export default function MapInfo({ lat, lng, zoom }: MapInfoProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-[#1c2127]/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-4 text-xs">
        <div className="text-gray-400">
          <span className="text-gray-500">Lat:</span>{' '}
          <span className="text-white font-mono">{lat.toFixed(4)}</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">Lng:</span>{' '}
          <span className="text-white font-mono">{lng.toFixed(4)}</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">Zoom:</span>{' '}
          <span className="text-white font-mono">{zoom.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

