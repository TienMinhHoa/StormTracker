'use client';

import { useState } from 'react';
import { WINDY_COLOR_STOPS } from './utils/windyColorScale';

interface WindLegendProps {
  opacity: number;
  timestamp?: string;
  isLoading?: boolean;
  onOpacityChange: (opacity: number) => void;
  onWindAnimationToggle?: (enabled: boolean) => void;
  className?: string;
}

export default function WindLegend({
  opacity,
  timestamp,
  isLoading = false,
  onOpacityChange,
  onWindAnimationToggle,
  className,
}: WindLegendProps) {
  const [windAnimationEnabled, setWindAnimationEnabled] = useState(false);

  // Tạo gradient string từ color stops
  const gradientStops = WINDY_COLOR_STOPS.map(([stop, color]) => `${color} ${stop * 100}%`).join(', ');
  const gradient = `linear-gradient(to right, ${gradientStops})`;

  // Các điểm đánh dấu trên thanh (0, 3, 5, 10, 15, 20, 30)
  const markers = [0, 3, 5, 10, 15, 20, 30];

  return (
    <div className={['flex w-[220px] flex-col gap-2 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]', className].filter(Boolean).join(' ')}>
      {/* Wind Animation Toggle */}
      {onWindAnimationToggle && (
        <label className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={windAnimationEnabled}
            onChange={(e) => {
              const newValue = e.target.checked;
              setWindAnimationEnabled(newValue);
              onWindAnimationToggle(newValue);
            }}
            className="rounded bg-transparent border-white/50 text-[#137fec] focus:ring-[#137fec] focus:ring-offset-0 w-3 h-3"
          />
          <span className="text-[11px]">Wind Animation</span>
        </label>
      )}

      {/* Opacity Control */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold flex-shrink-0">
          Opacity: {Math.round(opacity * 100)}%
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={opacity}
          onInput={(e) => onOpacityChange(parseFloat((e.target as HTMLInputElement).value))}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-gray-700/50 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:bg-white
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:border
                   [&::-webkit-slider-thumb]:border-[#137fec]
                   [&::-moz-range-thumb]:w-3
                   [&::-moz-range-thumb]:h-3
                   [&::-moz-range-thumb]:bg-white
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:border
                   [&::-moz-range-thumb]:border-[#137fec]"
        />
      </div>

      {/* Timestamp Indicator
      {timestamp && (
        <div className="flex items-center gap-2 text-[11px] text-white/80">
          <span className="font-semibold">Thời gian:</span>
          <span className="font-mono text-white">{timestamp}</span>
          {isLoading && (
            <div className="w-2 h-2 border border-white/30 border-t-white rounded-full animate-spin"></div>
          )}
        </div>
      )} */}

      {/* Wind Speed Legend */}
      <div className="relative w-full">
        {/* Gradient bar với rounded ends */}
        <div
          className="h-5 rounded-full shadow-lg"
          style={{
            background: gradient,
          }}
        />

        {/* Markers và labels nằm trong thanh */}
        <div className="absolute inset-0 flex items-center px-2">
          {/* Unit label "m/s" ở đầu thanh bên trái */}
          <span
            className="absolute text-[10px] font-semibold whitespace-nowrap"
            style={{
              left: '8px'
            }}
          >
            m/s
          </span>

          {/* Các số markers */}
          {markers.map((value) => {
            // Chỉ set padding cho số 0, số 30 để nguyên ở cuối thanh
            const leftPadding = 14; // Padding bên trái cho số 0
            const rightEnd = 96; // Vị trí cuối thanh cho số 30 (để không tràn ra ngoài)

            let position: number;
            if (value === 0) {
              // Số 0: dùng padding bên trái
              position = leftPadding;
            } else if (value === 30) {
              // Số 30: ở cuối thanh
              position = rightEnd;
            } else {
              // Các số khác: phân bố đều giữa vị trí 0 và 30
              const startPos = leftPadding;
              const endPos = rightEnd;
              const range = endPos - startPos;
              // Tính vị trí dựa trên tỷ lệ (value / 30)
              position = startPos + (value / 30) * range;
            }

            return (
              <div
                key={value}
                className="absolute flex items-center justify-center"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              >
                {/* Label nằm trong thanh */}
                <span className="text-[10px] font-semibold whitespace-nowrap">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

