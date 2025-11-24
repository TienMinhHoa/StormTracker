'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AVAILABLE_TIMESTAMPS, ALL_AVAILABLE_TIMESTAMPS } from './services/tiffService';
import type { Storm } from '../../services/stormApi';

type TimeControlsProps = {
  currentTimestamp?: string;
  onTimestampChange?: (timestamp: string) => void;
  isPlaying?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  className?: string;
  selectedStorm?: Storm | null;
};

export default function TimeControls({
  currentTimestamp,
  onTimestampChange,
  isPlaying = false,
  onPlayStateChange,
  className,
  selectedStorm
}: TimeControlsProps) {
  const [playing, setPlaying] = useState(isPlaying);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pendingIndexRef = useRef<number>(0);

  // Filter timestamps based on storm's date range
  const availableTimestamps = useMemo(() => {
    if (!selectedStorm) {
      return AVAILABLE_TIMESTAMPS;
    }

    // Parse storm dates as UTC (they come with 'Z' suffix from API)
    const startDate = new Date(selectedStorm.start_date);
    const endDate = selectedStorm.end_date ? new Date(selectedStorm.end_date) : new Date();

    // Filter timestamps that fall within storm's date range
    // GFS timestamps are in "YYYY-MM-DD HH:MM" format (local time)
    // We need to compare them properly with UTC storm dates
    const filtered = ALL_AVAILABLE_TIMESTAMPS.filter(timestamp => {
      // Parse GFS timestamp as local time, then convert to UTC for comparison
      const [datePart, timePart] = timestamp.timestamp.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);

      // Create date in local timezone, then get UTC time for comparison
      const localDate = new Date(year, month - 1, day, hours, minutes);
      const timestampUtc = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));

      return timestampUtc >= startDate && timestampUtc <= endDate;
    });

    // If no timestamps match, fallback to all available (better UX)
    if (filtered.length === 0) {
      console.warn('⚠️ No GFS timestamps match storm date range, using all available timestamps');
      console.warn(`   Storm: ${selectedStorm.start_date} to ${selectedStorm.end_date || 'now'}`);
      console.warn(`   Available GFS range: ${ALL_AVAILABLE_TIMESTAMPS[0]?.timestamp} to ${ALL_AVAILABLE_TIMESTAMPS[ALL_AVAILABLE_TIMESTAMPS.length - 1]?.timestamp}`);
      return AVAILABLE_TIMESTAMPS;
    }

    console.log(`✅ Filtered ${filtered.length} GFS timestamps for storm ${selectedStorm.name}`);
    console.log(`   Storm range: ${selectedStorm.start_date} to ${selectedStorm.end_date || 'now'}`);
    console.log(`   GFS range: ${filtered[0]?.timestamp} to ${filtered[filtered.length - 1]?.timestamp}`);

    return filtered;
  }, [selectedStorm]);

  // Update currentIndex when currentTimestamp changes
  useEffect(() => {
    if (currentTimestamp && availableTimestamps.length > 0) {
      const index = availableTimestamps.findIndex(t => t.timestamp === currentTimestamp);
      if (index >= 0) {
        setCurrentIndex(index);
      } else {
        // If current timestamp not in filtered list, set to first available
        setCurrentIndex(0);
        onTimestampChange?.(availableTimestamps[0].timestamp);
      }
    }
  }, [currentTimestamp, availableTimestamps, onTimestampChange]);

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (playing && availableTimestamps.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % availableTimestamps.length;
          const nextTimestamp = availableTimestamps[nextIndex].timestamp;
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
  }, [playing, onTimestampChange, availableTimestamps]);

  const handlePlayPause = useCallback(() => {
    const newPlayingState = !playing;
    setPlaying(newPlayingState);
    onPlayStateChange?.(newPlayingState);
  }, [playing, onPlayStateChange]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    pendingIndexRef.current = index;

    if (!isDragging) {
      // If not dragging (e.g., direct click), update immediately
    const timestamp = availableTimestamps[index]?.timestamp;
    if (timestamp) {
      setCurrentIndex(index);
      onTimestampChange?.(timestamp);
    }
    } else {
      // If dragging, just update visual position without triggering change
      setCurrentIndex(index);
    }
  }, [isDragging, onTimestampChange, availableTimestamps]);

  const handleSliderMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleSliderMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Apply the pending change when dragging ends
      const timestamp = availableTimestamps[pendingIndexRef.current]?.timestamp;
      if (timestamp) {
        onTimestampChange?.(timestamp);
      }
    }
  }, [isDragging, onTimestampChange, availableTimestamps]);

  const progressPercentage = availableTimestamps.length > 0 
    ? (currentIndex / (availableTimestamps.length - 1)) * 100 
    : 0;

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
              {availableTimestamps[currentIndex]?.timestamp || 'N/A'}
            </span>
          </div>

          {/* Custom styled slider */}
          <div className="relative pr-4">
            {availableTimestamps.length === 0 ? (
              <div className="w-full h-2 bg-gray-700/70 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-400">Không có dữ liệu thời gian</span>
              </div>
            ) : (
              <input
                type="range"
                min="0"
                max={Math.max(0, availableTimestamps.length - 1)}
                value={currentIndex}
                onChange={handleSliderChange}
                onMouseDown={handleSliderMouseDown}
                onMouseUp={handleSliderMouseUp}
                onMouseLeave={handleSliderMouseUp}
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
            )}

            {/* Time labels */}
            {availableTimestamps.length > 0 && (
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{availableTimestamps[0]?.timestamp || ''}</span>
                <span>{availableTimestamps[availableTimestamps.length - 1]?.timestamp || ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
