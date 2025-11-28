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

  // Use AVAILABLE_TIMESTAMPS which is already filtered by tiffService based on storm
  const availableTimestamps = useMemo(() => {
    // AVAILABLE_TIMESTAMPS được filter sẵn bởi getTimestampsForStorm() trong Map.tsx
    // Không cần filter lại ở đây nữa
    const timestamps = AVAILABLE_TIMESTAMPS;

    if (timestamps.length === 0) {
      console.warn('⚠️ No GFS timestamps available');
      return [];
    }

    if (selectedStorm) {
      console.log(`✅ Using ${timestamps.length} timestamps for storm ${selectedStorm.name}`);
      console.log(`   Storm range: ${selectedStorm.start_date} to ${selectedStorm.end_date || 'ongoing'}`);
      if (timestamps.length > 0) {
        console.log(`   GFS range: ${timestamps[0]?.timestamp} to ${timestamps[timestamps.length - 1]?.timestamp}`);
      }
    }

    return timestamps;
  }, [AVAILABLE_TIMESTAMPS, selectedStorm?.storm_id]);

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

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const timestamp = availableTimestamps[newIndex]?.timestamp;
      if (timestamp) {
        setCurrentIndex(newIndex);
        onTimestampChange?.(timestamp);
      }
    }
  }, [currentIndex, availableTimestamps, onTimestampChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < availableTimestamps.length - 1) {
      const newIndex = currentIndex + 1;
      const timestamp = availableTimestamps[newIndex]?.timestamp;
      if (timestamp) {
        setCurrentIndex(newIndex);
        onTimestampChange?.(timestamp);
      }
    }
  }, [currentIndex, availableTimestamps, onTimestampChange]);

  const isFirstTimestamp = currentIndex === 0;
  const isLastTimestamp = currentIndex === availableTimestamps.length - 1;

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-4">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={isFirstTimestamp || availableTimestamps.length === 0}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
            isFirstTimestamp || availableTimestamps.length === 0
              ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              : 'bg-[#137fec] hover:bg-[#137fec]/80 text-white shadow-lg shadow-[#137fec]/30 hover:scale-110'
          }`}
          title="Giờ trước"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Current Time Display */}
        <div className="flex flex-col items-center gap-1 min-w-[200px] px-4 py-2 bg-[#1a2332]/90 backdrop-blur-sm rounded-lg border border-white/10">
          <span className="text-xs text-gray-400 font-medium">Thời gian dự báo</span>
          <span className="text-base font-bold text-white font-mono">
            {availableTimestamps[currentIndex]?.timestamp || 'N/A'}
          </span>
          {availableTimestamps.length > 0 && (
            <span className="text-xs text-gray-500">
              {currentIndex + 1} / {availableTimestamps.length}
            </span>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={isLastTimestamp || availableTimestamps.length === 0}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
            isLastTimestamp || availableTimestamps.length === 0
              ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              : 'bg-[#137fec] hover:bg-[#137fec]/80 text-white shadow-lg shadow-[#137fec]/30 hover:scale-110'
          }`}
          title="Giờ sau"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
