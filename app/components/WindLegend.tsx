'use client';

import { useState } from 'react';

export default function WindLegend() {
  const [isExpanded, setIsExpanded] = useState(true);

  const windScale = [
    { speed: '0-5', color: '#3288bd', label: 'Nhẹ' },
    { speed: '5-10', color: '#66c2a5', label: 'Vừa phải' },
    { speed: '10-15', color: '#fee08b', label: 'Mạnh' },
    { speed: '15-20', color: '#f46d43', label: 'Rất mạnh' },
    { speed: '20+', color: '#d53e4f', label: 'Cực mạnh' },
  ];

  return (
    <div className="absolute bottom-20 left-4 bg-[#1c2127]/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 text-left flex items-center justify-between hover:bg-[#1c2127] transition-colors"
      >
        <span className="text-white font-semibold text-sm">🌬️ Wind Speed (m/s)</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1">
          <div className="space-y-2">
            {windScale.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div
                  className="w-8 h-4 rounded shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1">
                  <div className="text-gray-300 text-xs font-medium">
                    {item.speed} m/s
                  </div>
                  <div className="text-gray-400 text-xs">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

