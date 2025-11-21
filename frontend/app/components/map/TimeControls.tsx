'use client';

import { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_TIMESTAMPS } from './services/tiffService';

type TimeControlsProps = {
  currentTimestamp?: string;
  onTimestampChange?: (timestamp: string) => void;
  isPlaying?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  className?: string;
};

export default function TimeControls({
  currentTimestamp,
  onTimestampChange,
  isPlaying = false,
  onPlayStateChange,
  className
}: TimeControlsProps) {
  const [playing, setPlaying] = useState(isPlaying);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Update currentIndex when currentTimestamp changes
  useEffect(() => {
    if (currentTimestamp) {
      const index = AVAILABLE_TIMESTAMPS.findIndex(t => t.timestamp === currentTimestamp);
      if (index >= 0) {
        setCurrentIndex(index);
      }
    }
  }, [currentTimestamp]);

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (playing) {
      interval = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % AVAILABLE_TIMESTAMPS.length;
          const nextTimestamp = AVAILABLE_TIMESTAMPS[nextIndex].timestamp;
          onTimestampChange?.(nextTimestamp);
          return nextIndex;
        });
      }, 2000); // Change every 2 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [playing, onTimestampChange]);

  const handlePlayPause = useCallback(() => {
    const newPlayingState = !playing;
    setPlaying(newPlayingState);
    onPlayStateChange?.(newPlayingState);
  }, [playing, onPlayStateChange]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    const timestamp = AVAILABLE_TIMESTAMPS[index]?.timestamp;
    if (timestamp) {
      setCurrentIndex(index);
      onTimestampChange?.(timestamp);
    }
  }, [onTimestampChange]);

  if (!AVAILABLE_TIMESTAMPS.length) {
    return null;
  }

  const progressPercentage = (currentIndex / (AVAILABLE_TIMESTAMPS.length - 1)) * 100;

  return (
    <div className={className}>
      <div className="flex items-center gap-6 w-full">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className="flex items-center justify-center w-9 h-9 bg-[#137fec] hover:bg-[#137fec]/80 text-white rounded-full transition-colors shadow-lg shadow-[#137fec]/30"
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <span className="text-sm">⏸️</span>
          ) : (
            <span className="text-sm">▶️</span>
          )}
        </button>

        {/* Time Slider */}
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center justify-between mb-2 pr-4">
            <label className="text-sm font-medium text-white tracking-wide">
              Thời gian dự báo gió
            </label>
            <span className="text-xs text-gray-300 font-mono">
              {AVAILABLE_TIMESTAMPS[currentIndex]?.timestamp || 'N/A'}
            </span>
          </div>

          {/* Custom styled slider */}
          <div className="relative pr-4">
            <input
              type="range"
              min="0"
              max={AVAILABLE_TIMESTAMPS.length - 1}
              value={currentIndex}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-700/70 rounded-full appearance-none cursor-pointer
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
                  #137fec ${progressPercentage}%,
                  #374151 ${progressPercentage}%,
                  #374151 100%)`
              }}
            />

            {/* Time labels */}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{AVAILABLE_TIMESTAMPS[0]?.timestamp}</span>
              <span>{AVAILABLE_TIMESTAMPS[AVAILABLE_TIMESTAMPS.length - 1]?.timestamp}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
