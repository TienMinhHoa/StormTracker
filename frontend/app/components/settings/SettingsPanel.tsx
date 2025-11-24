'use client';

import { useState } from 'react';

type SettingsPanelProps = {
  showNewsMarkers: boolean;
  onShowNewsMarkersChange: (show: boolean) => void;
  onClose: () => void;
};

export default function SettingsPanel({
  showNewsMarkers,
  onShowNewsMarkersChange,
  onClose
}: SettingsPanelProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#101922]">
      {/* Fixed Header with Back Button */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">Back to Storm Tracker</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <div className="flex flex-col gap-6">
            {/* Title */}
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Cài đặt
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Tùy chỉnh trải nghiệm của bạn
              </p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
              {/* Map Settings */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Bản đồ</h2>

                {/* Show News Markers Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#1c2127] rounded-lg">
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-medium">Hiển thị marker tin tức</span>
                    <span className="text-gray-400 text-sm">
                      Hiển thị marker trên bản đồ khi xem tin tức
                    </span>
                  </div>
                  <button
                    onClick={() => onShowNewsMarkersChange(!showNewsMarkers)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showNewsMarkers ? 'bg-[#137fec]' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showNewsMarkers ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Future Settings Placeholder */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Thông báo</h2>
                <div className="p-4 bg-[#1c2127] rounded-lg">
                  <div className="text-gray-400 text-sm">
                    Các tùy chọn thông báo sẽ được thêm trong phiên bản tương lai
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Giao diện</h2>
                <div className="p-4 bg-[#1c2127] rounded-lg">
                  <div className="text-gray-400 text-sm">
                    Tùy chỉnh giao diện sẽ được thêm trong phiên bản tương lai
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




