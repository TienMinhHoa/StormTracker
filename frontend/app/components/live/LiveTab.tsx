'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLiveTracking, getLiveTrackingHistory, type LiveTrackingData } from '../../services/liveApi';

const TRACKING_ID = 'NOWLIVE1234';
const REFRESH_INTERVAL = 5000; // 5 giây

export default function LiveTab() {
  const [liveData, setLiveData] = useState<LiveTrackingData | null>(null);
  const [history, setHistory] = useState<LiveTrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Hàm load dữ liệu live
  const loadLiveData = useCallback(async () => {
    try {
      setError(null);
      const data = await getLiveTracking(TRACKING_ID);
      setLiveData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu live');
      console.error('Failed to load live data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hàm load lịch sử
  const loadHistory = useCallback(async () => {
    try {
      const data = await getLiveTrackingHistory(TRACKING_ID, 20);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  // Load dữ liệu ban đầu
  useEffect(() => {
    loadLiveData();
    loadHistory();
  }, [loadLiveData, loadHistory]);

  // Auto refresh
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      loadLiveData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isAutoRefresh, loadLiveData]);

  // Thủ công refresh
  const handleRefresh = () => {
    setLoading(true);
    loadLiveData();
    loadHistory();
  };

  if (loading && !liveData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="text-gray-400">Đang tải dữ liệu live...</p>
        </div>
      </div>
    );
  }

  if (error && !liveData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-4xl">⚠️</div>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header Controls */}
      <div className="px-4 py-3 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isAutoRefresh ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <h2 className="text-white font-semibold">Live Tracking</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
            title="Làm mới"
          >
            <svg
              className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-400">
            ID: <span className="text-teal-400 font-mono">{TRACKING_ID}</span>
          </div>
          {lastUpdate && (
            <div className="text-gray-400">
              Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={isAutoRefresh}
            onChange={(e) => setIsAutoRefresh(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 bg-[#1c2127]"
          />
          Tự động làm mới ({REFRESH_INTERVAL / 1000}s)
        </label>
      </div>

      {/* Live Data Display */}
      {liveData && (
        <div className="px-4 py-3 space-y-3">
          <div className="bg-[#1c2127] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Trạng thái</span>
              <span className="px-3 py-1 bg-teal-600 text-white text-sm rounded-full">
                {liveData.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-gray-400 text-xs">Vĩ độ</div>
                <div className="text-white font-mono text-sm">
                  {liveData.location.latitude.toFixed(4)}°
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-gray-400 text-xs">Kinh độ</div>
                <div className="text-white font-mono text-sm">
                  {liveData.location.longitude.toFixed(4)}°
                </div>
              </div>
            </div>

            {liveData.wind_speed && (
              <div className="space-y-1">
                <div className="text-gray-400 text-xs">Tốc độ gió</div>
                <div className="text-white font-semibold">
                  {liveData.wind_speed} km/h
                </div>
              </div>
            )}

            {liveData.pressure && (
              <div className="space-y-1">
                <div className="text-gray-400 text-xs">Áp suất</div>
                <div className="text-white font-semibold">
                  {liveData.pressure} hPa
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-gray-400 text-xs">Thời gian</div>
              <div className="text-white text-sm">
                {new Date(liveData.timestamp).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <h3 className="text-white font-semibold mb-3 text-sm">Lịch sử di chuyển</h3>
          <div className="space-y-2">
            {history.map((item, index) => (
              <div
                key={index}
                className="bg-[#1c2127] rounded-lg p-3 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">
                    {new Date(item.timestamp).toLocaleString('vi-VN')}
                  </span>
                  <span className="text-teal-400">{item.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-gray-400">
                  <div>
                    Lat: <span className="text-white">{item.location.latitude.toFixed(4)}°</span>
                  </div>
                  <div>
                    Lon: <span className="text-white">{item.location.longitude.toFixed(4)}°</span>
                  </div>
                </div>
                {item.wind_speed && (
                  <div className="text-gray-400">
                    Gió: <span className="text-white">{item.wind_speed} km/h</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
