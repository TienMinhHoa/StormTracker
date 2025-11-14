'use client';

import { useState, useEffect, useRef } from 'react';

type MapControlsProps = {
  onLayerToggle?: (layer: string, enabled: boolean) => void;
};

export default function MapControls({ onLayerToggle }: MapControlsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLayers, setShowLayers] = useState(false);
  const [layers, setLayers] = useState({
    windSpeed: false,
    temperature: true,
    precipitation: false,
    pressure: false,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLayers(false);
      }
    };

    if (showLayers) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLayers]);

  const toggleLayer = (layer: string) => {
    setLayers((prev) => {
      const newLayers = { ...prev, [layer]: !prev[layer as keyof typeof layers] };
      onLayerToggle?.(layer, newLayers[layer as keyof typeof layers]);
      return newLayers;
    });
  };

  return (
    <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 z-10">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="flex items-stretch rounded-lg h-12 shadow-lg overflow-hidden">
          <div className="flex items-center justify-center pl-4 bg-[#1c2127]/80 backdrop-blur-sm text-gray-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a location"
            className="flex-1 bg-[#1c2127]/80 backdrop-blur-sm text-white placeholder:text-gray-400 px-4 border-none focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* Layers Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowLayers(!showLayers)}
          className="flex items-center justify-center rounded-lg h-12 bg-[#137fec] text-white gap-2 text-sm font-bold px-4 shadow-lg hover:bg-[#137fec]/90 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
          </svg>
          <span className="hidden md:block">Layers</span>
        </button>

        {/* Layers Dropdown */}
        {showLayers && (
          <div className="absolute top-full right-0 mt-2 w-56 rounded-lg bg-[#1c2127]/95 backdrop-blur-sm shadow-lg p-2 animate-fadeIn">
            <div className="flex flex-col gap-1 text-white">
              <label className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.windSpeed}
                  onChange={() => toggleLayer('windSpeed')}
                  className="rounded bg-transparent border-white/50 text-[#137fec] focus:ring-[#137fec] focus:ring-offset-0"
                />
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
                <span className="text-sm">Wind Speed</span>
              </label>

              <label className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.temperature}
                  onChange={() => toggleLayer('temperature')}
                  className="rounded bg-transparent border-white/50 text-[#137fec] focus:ring-[#137fec] focus:ring-offset-0"
                />
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="text-sm">Temperature</span>
              </label>

              <label className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.precipitation}
                  onChange={() => toggleLayer('precipitation')}
                  className="rounded bg-transparent border-white/50 text-[#137fec] focus:ring-[#137fec] focus:ring-offset-0"
                />
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm">Precipitation</span>
              </label>

              <label className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.pressure}
                  onChange={() => toggleLayer('pressure')}
                  className="rounded bg-transparent border-white/50 text-[#137fec] focus:ring-[#137fec] focus:ring-offset-0"
                />
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm">Pressure</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

