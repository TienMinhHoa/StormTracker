'use client';

import { useState, useEffect } from 'react';
import { getLatestForecast, type Forecast, type ForecastData } from '../../services/forecastApi';

type ForecastSource = 'nchmf' | 'jtwc';

interface StormForecastProps {
  stormId: string;
}

export default function StormForecast({ stormId }: StormForecastProps) {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<ForecastSource>('nchmf');

  useEffect(() => {
    const fetchForecast = async () => {
      console.log('🌀 StormForecast: stormId =', stormId);
      
      if (!stormId) {
        console.log('⚠️ StormForecast: No stormId provided');
        setForecast(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`📡 Fetching forecast for storm: ${stormId}`);
        const data = await getLatestForecast(stormId);
        console.log('✅ Forecast data received:', data);
        setForecast(data);
        
        // Auto-select first available source
        if (data) {
          if (data.nchmf) {
            setSelectedSource('nchmf');
          } else if (data.jtwc) {
            setSelectedSource('jtwc');
          }
        }
      } catch (err) {
        console.error('❌ Failed to load forecast:', err);
        setError('Không thể tải dự báo bão');
        setForecast(null);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [stormId]);

  const formatValue = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return String(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getRiskLevelColor = (level: number | null | undefined): string => {
    if (!level) return 'text-gray-400';
    if (level >= 4) return 'text-red-500';
    if (level >= 3) return 'text-orange-500';
    if (level >= 2) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskLevelText = (level: number | null | undefined): string => {
    if (!level) return 'Không xác định';
    if (level >= 4) return 'Rất cao';
    if (level >= 3) return 'Cao';
    if (level >= 2) return 'Trung bình';
    return 'Thấp';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400 text-sm">Đang tải dự báo bão...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900/40 to-orange-900/40 rounded-lg p-4 border border-red-500/30">
        <div className="flex items-center justify-center py-8">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg p-4 border border-gray-600/30">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400 text-sm">Không có dữ liệu dự báo</div>
        </div>
      </div>
    );
  }

  const activeForecast: ForecastData | null = 
    selectedSource === 'nchmf' ? forecast.nchmf || null : forecast.jtwc || null;

  const hasNCHMF = !!forecast.nchmf;
  const hasJTWC = !!forecast.jtwc;

  return (
    <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg p-4 border border-blue-500/30">
      {/* Header with Source Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌀</span>
          <h3 className="text-lg font-bold text-white">Dự báo Bão</h3>
        </div>

        {/* Source Selection */}
        <div className="flex gap-2">
          {hasNCHMF && (
            <button
              onClick={() => setSelectedSource('nchmf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSource === 'nchmf'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
              }`}
            >
              🇻🇳 NCHMF
            </button>
          )}
          {hasJTWC && (
            <button
              onClick={() => setSelectedSource('jtwc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSource === 'jtwc'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
              }`}
            >
              🌏 JTWC
            </button>
          )}
        </div>
      </div>

      {!activeForecast ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          Không có dữ liệu từ nguồn đã chọn
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Situation */}
          <div className="bg-black/30 rounded-lg p-3 border border-blue-400/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-yellow-400 text-lg">⚡</span>
              <h4 className="font-semibold text-white text-sm">Tình hình hiện tại</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-gray-400">📍 Vị trí</div>
                <div className="text-white font-medium">
                  {activeForecast.current.position.lat.toFixed(1)}°N, {activeForecast.current.position.lon.toFixed(1)}°E
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-400">🕐 Thời gian</div>
                <div className="text-white font-medium">{formatDate(activeForecast.current.time)}</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-400">💨 Sức gió</div>
                <div className="text-white font-medium">
                  Cấp {formatValue(activeForecast.current.intensity.wind)} ({formatValue(activeForecast.current.intensity.gust)} giật)
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-400">➡️ Di chuyển</div>
                <div className="text-white font-medium">
                  {activeForecast.current.movement.direction}, {formatValue(activeForecast.current.movement.speed_kmh)} km/h
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Timeline */}
          {activeForecast.forecast && activeForecast.forecast.length > 0 && (
            <div className="bg-black/30 rounded-lg p-3 border border-purple-400/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-400 text-lg">📅</span>
                <h4 className="font-semibold text-white text-sm">Dự báo {activeForecast.forecast.length * 24}h tới</h4>
              </div>

              <div className="space-y-3">
                {activeForecast.forecast.map((item, index) => (
                  <div 
                    key={index}
                    className="bg-gray-800/50 rounded-lg p-2.5 border border-purple-300/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-300 font-bold text-xs">+{(index + 1) * 24}h</span>
                        <span className="text-gray-400 text-xs">{formatDate(item.time)}</span>
                      </div>
                      {item.risk_level !== undefined && (
                        <span className={`text-xs font-bold ${getRiskLevelColor(item.risk_level)}`}>
                          ⚠️ {getRiskLevelText(item.risk_level)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">📍 </span>
                        <span className="text-white">
                          {item.position.lat.toFixed(1)}°N, {item.position.lon.toFixed(1)}°E
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">💨 </span>
                        <span className="text-white">
                          Cấp {formatValue(item.intensity.wind)} ({formatValue(item.intensity.gust)} giật)
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">➡️ </span>
                        <span className="text-white">
                          {item.movement.direction}, {formatValue(item.movement.speed_kmh)} km/h
                        </span>
                      </div>

                      {item.danger_zone && (
                        <div className="col-span-2 mt-1 pt-2 border-t border-red-500/20">
                          <div className="text-red-400 font-medium mb-1">⚠️ Vùng nguy hiểm</div>
                          <div className="text-white">
                            Vĩ độ: {item.danger_zone.lat_range[0]}°N - {item.danger_zone.lat_range[1]}°N
                          </div>
                          <div className="text-white">
                            Kinh độ: {item.danger_zone.lon_range[0]}°E - {item.danger_zone.lon_range[1]}°E
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Long Range Forecast */}
          {activeForecast.long_range && (
            <div className="bg-black/30 rounded-lg p-3 border border-green-400/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 text-lg">🔮</span>
                <h4 className="font-semibold text-white text-sm">Xu hướng dài hạn ({activeForecast.long_range.time_range})</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">➡️ Di chuyển: </span>
                  <span className="text-white">
                    {activeForecast.long_range.movement.direction}, {formatValue(activeForecast.long_range.movement.speed_kmh)} km/h
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">📉 Cường độ: </span>
                  <span className="text-white">{activeForecast.long_range.intensity_trend}</span>
                </div>
              </div>
            </div>
          )}

          {/* Update Time */}
          <div className="text-center text-xs text-gray-500">
            Cập nhật: {formatDate(forecast.created_at)}
          </div>
        </div>
      )}
    </div>
  );
}
