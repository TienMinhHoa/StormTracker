'use client';

import { AVAILABLE_TIMESTAMPS } from './services/tiffService';

type MapControlsProps = {
  currentTimestamp?: string;
  onTimestampChange?: (timestamp: string) => void;
};

export default function MapControls({
  currentTimestamp,
  onTimestampChange
}: MapControlsProps) {
  if (!AVAILABLE_TIMESTAMPS.length) {
    return null;
  }

  const currentIndex = AVAILABLE_TIMESTAMPS.findIndex(t => t.timestamp === currentTimestamp);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    const timestamp = AVAILABLE_TIMESTAMPS[index]?.timestamp;
    if (timestamp && onTimestampChange) {
      onTimestampChange(timestamp);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 z-10 bg-[#101922]/90 backdrop-blur-sm rounded-lg border border-white/10 p-4">
      <div className="flex items-center gap-4">
        {/* Time Slider */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-white">
              Thời gian dự báo gió
            </label>
            <span className="text-xs text-gray-400">
              {AVAILABLE_TIMESTAMPS[activeIndex]?.timestamp || 'N/A'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={AVAILABLE_TIMESTAMPS.length - 1}
            value={activeIndex}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:bg-[#137fec]
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:border-2
                       [&::-webkit-slider-thumb]:border-white
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-moz-range-thumb]:w-4
                       [&::-moz-range-thumb]:h-4
                       [&::-moz-range-thumb]:bg-[#137fec]
                       [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:border-2
                       [&::-moz-range-thumb]:border-white
                       [&::-moz-range-thumb]:shadow-lg"
            style={{
              background: `linear-gradient(to right,
                #137fec 0%,
                #137fec ${(activeIndex / (AVAILABLE_TIMESTAMPS.length - 1)) * 100}%,
                #374151 ${(activeIndex / (AVAILABLE_TIMESTAMPS.length - 1)) * 100}%,
                #374151 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{AVAILABLE_TIMESTAMPS[0]?.timestamp}</span>
            <span>{AVAILABLE_TIMESTAMPS[AVAILABLE_TIMESTAMPS.length - 1]?.timestamp}</span>
          </div>
        </div>

        {/* Play/Pause Button (optional) */}
        <button className="px-3 py-2 bg-[#137fec] hover:bg-[#137fec]/80 text-white text-sm font-medium rounded-lg transition-colors">
          ▶️ Phát
        </button>
      </div>
    </div>
  );
}

