'use client';

import { useState } from 'react';

interface LayerControlsProps {
  onOpacityChange: (opacity: number) => void;
  onToggleLayer: (visible: boolean) => void;
}

export default function LayerControls({
  onOpacityChange,
  onToggleLayer,
}: LayerControlsProps) {
  const [opacity, setOpacity] = useState(70);
  const [isVisible, setIsVisible] = useState(true);

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseInt(e.target.value);
    setOpacity(newOpacity);
    onOpacityChange(newOpacity / 100);
  };

  const handleToggle = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    onToggleLayer(newVisibility);
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-700 min-w-[250px]">
      <h3 className="text-white font-semibold mb-3 text-sm">Layer Controls</h3>
      
      {/* Toggle Wind Layer */}
      <div className="flex items-center justify-between mb-4">
        <label className="text-gray-300 text-sm">Wind Layer</label>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isVisible ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isVisible ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Opacity Slider */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <label className="text-gray-300 text-sm">Opacity</label>
          <span className="text-gray-400 text-xs">{opacity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={handleOpacityChange}
          disabled={!isVisible}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      {/* Info */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <p className="text-gray-400 text-xs">
          Data source: GeoServer
        </p>
      </div>
    </div>
  );
}

