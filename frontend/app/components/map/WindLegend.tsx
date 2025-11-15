'use client';

import { useState } from 'react';
import { WINDY_COLOR_STOPS } from './utils/windyColorScale';

interface WindLegendProps {
  opacity: number;
  forecastHour?: number;
  isLoading?: boolean;
  onOpacityChange: (opacity: number) => void;
  onForecastHourChange?: (hour: number) => void;
  onWindAnimationToggle?: (enabled: boolean) => void;
}

export default function WindLegend({
  opacity,
  forecastHour = 0,
  isLoading = false,
  onOpacityChange,
  onForecastHourChange,
  onWindAnimationToggle,
}: WindLegendProps) {
  const [windAnimationEnabled, setWindAnimationEnabled] = useState(false);

  // Tạo gradient string từ color stops
  const gradientStops = WINDY_COLOR_STOPS.map(([stop, color]) => `${color} ${stop * 100}%`).join(', ');
  const gradient = `linear-gradient(to right, ${gradientStops})`;

  // Các điểm đánh dấu trên thanh (0, 3, 5, 10, 15, 20, 30)
  const markers = [0, 3, 5, 10, 15, 20, 30];

  return (
    <div className="absolute bottom-4 right-20 z-10">
      <div className="flex flex-col gap-2">
        {/* Layer Toggles */}
        <div className="flex justify-end gap-3">
          {onWindAnimationToggle && (
            <label className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10 cursor-pointer">
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
              <span className="text-xs text-white">Wind Animation</span>
            </label>
          )}

        </div>

        {/* 3 thanh controls */}
        <div className="flex flex-col gap-2">
          {/* Forecast Hour */}
          {onForecastHourChange && (
            <div className="flex items-center gap-2">
              <span className="text-white text-[10px] font-medium flex-shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                Forecast: +{forecastHour}h
              </span>
              <div className="relative flex-1 flex items-center gap-2" style={{ width: '300px' }}>
                {isLoading && (
                  <div className="w-2 h-2 border border-white/30 border-t-white rounded-full animate-spin flex-shrink-0"></div>
                )}
                <input
                  type="range"
                  min="0"
                  max="168"
                  step="6"
                  value={forecastHour}
                  onChange={(e) => onForecastHourChange(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-700/50 rounded-lg appearance-none cursor-pointer"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Opacity */}
          <div className="flex items-center gap-2">
            <span className="text-white text-[10px] font-medium flex-shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
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
              className="flex-1 h-1.5 bg-gray-700/50 rounded-lg appearance-none cursor-pointer"
              style={{ width: '300px' }}
            />
          </div>

          {/* Wind Speed Legend */}
          <div className="relative" style={{ width: '300px' }}>
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
                className="absolute text-white text-[10px] font-semibold whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  left: '8px'
                }}
              >
                m/s
              </span>

              {/* Các số markers */}
              {markers.map((value) => {
                // Chỉ set padding cho số 0, số 30 để nguyên ở cuối thanh
                const leftPadding = 12; // Padding bên trái cho số 0
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
                    <span
                      className="text-white text-[10px] font-semibold whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                    >
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

