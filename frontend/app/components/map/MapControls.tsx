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

  // Chuyển sang timestamp trước đó (quá khứ)
  const handlePrevious = () => {
    if (activeIndex > 0) {
      const timestamp = AVAILABLE_TIMESTAMPS[activeIndex - 1]?.timestamp;
      if (timestamp && onTimestampChange) {
        onTimestampChange(timestamp);
      }
    }
  };

  // Chuyển sang timestamp tiếp theo (tương lai)
  const handleNext = () => {
    if (activeIndex < AVAILABLE_TIMESTAMPS.length - 1) {
      const timestamp = AVAILABLE_TIMESTAMPS[activeIndex + 1]?.timestamp;
      if (timestamp && onTimestampChange) {
        onTimestampChange(timestamp);
      }
    }
  };

  const isFirstTimestamp = activeIndex === 0;
  const isLastTimestamp = activeIndex === AVAILABLE_TIMESTAMPS.length - 1;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-10 bg-[#101922]/90 backdrop-blur-sm rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Current Time Display */}
        <div className="flex-1">
          <div className="text-sm font-medium text-white mb-1">
            Thời gian dự báo gió
          </div>
          <div className="text-lg font-bold text-[#137fec]">
            {AVAILABLE_TIMESTAMPS[activeIndex]?.timestamp || 'N/A'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {activeIndex + 1} / {AVAILABLE_TIMESTAMPS.length} timestamps
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={isFirstTimestamp}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${isFirstTimestamp
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-[#137fec] hover:bg-[#137fec]/80 text-white hover:shadow-lg'
              }
            `}
            title={isFirstTimestamp ? 'Đã đến timestamp đầu tiên' : 'Quay lại giờ trước'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Trước</span>
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={isLastTimestamp}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${isLastTimestamp
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-[#137fec] hover:bg-[#137fec]/80 text-white hover:shadow-lg'
              }
            `}
            title={isLastTimestamp ? 'Đã đến timestamp cuối cùng' : 'Tiến tới giờ sau'}
          >
            <span>Sau</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

