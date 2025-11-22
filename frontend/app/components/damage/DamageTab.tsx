'use client';

import { useState } from 'react';
import { DamageAssessment, getDamageAssessments } from '../../data';

type DamageTabProps = {
  stormId?: number;
  onDamageClick?: (damage: DamageAssessment) => void;
};

export default function DamageTab({ stormId, onDamageClick }: DamageTabProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Get damage data from mock data helpers (simulating API call)
  const damageData: DamageAssessment[] = stormId ? getDamageAssessments(stormId) : [];

  const handleDamageClick = (damage: DamageAssessment) => {
    setExpandedId(expandedId === damage.id ? null : damage.id);
    onDamageClick?.(damage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (fatalities: number, injured: number) => {
    const totalAffected = fatalities + injured;
    if (totalAffected >= 50) return { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400' };
    if (totalAffected >= 25) return { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-400' };
    if (totalAffected >= 10) return { bg: 'bg-yellow-500/10', border: 'border-yellow-500', text: 'text-yellow-400' };
    return { bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-400' };
  };

  const totalFatalities = damageData.reduce((sum, d) => sum + d.total_fatalities, 0);
  const totalInjured = damageData.reduce((sum, d) => sum + d.total_injured, 0);
  const totalFacilities = damageData.reduce((sum, d) => sum + d.total_facilities, 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 space-y-4">
        {/* Header with Summary */}
        <div className="bg-[#1c2127] rounded-lg p-4">
          <h2 className="text-lg font-bold text-white mb-3">Tổng quan thiệt hại</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-400">{totalFatalities}</div>
              <div className="text-xs text-gray-400">Tử vong</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-400">{totalInjured}</div>
              <div className="text-xs text-gray-400">Bị thương</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-400">{totalFacilities}</div>
              <div className="text-xs text-gray-400">Cơ sở hạ tầng</div>
            </div>
          </div>
        </div>

        {/* Damage Assessment List */}
        <div className="flex flex-col gap-3">
          {damageData.map((damage) => {
            const colors = getSeverityColor(damage.total_fatalities, damage.total_injured);
            const isExpanded = expandedId === damage.id;

            return (
              <div
                key={damage.id}
                className={`${colors.bg} border-l-4 ${colors.border} rounded-r-lg overflow-hidden`}
              >
                <div
                  className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => handleDamageClick(damage)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏗️</span>
                      <h3 className={`font-bold ${colors.text} text-sm`}>
                        Đánh giá thiệt hại #{damage.id}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-400">
                        Cập nhật: {formatDate(damage.updated_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">
                      {damage.lat.toFixed(4)}°N, {damage.lon.toFixed(4)}°E
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      💀 {damage.total_fatalities}
                    </span>
                    <span className="flex items-center gap-1">
                      🤕 {damage.total_injured}
                    </span>
                    <span className="flex items-center gap-1">
                      🏢 {damage.total_facilities}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className={`px-3 pb-3 pt-2 border-t ${colors.border}/20`}>
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div>
                        <p className="text-gray-400">Thời gian đánh giá:</p>
                        <p className="text-white">{formatDate(damage.time)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Nguồn tin:</p>
                        <p className="text-white">News ID: {damage.news_id}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mb-3 space-y-1">
                      <p>📍 Tọa độ chính xác: {damage.lat.toFixed(6)}°N, {damage.lon.toFixed(6)}°E</p>
                      <p>🆔 ID đánh giá: {damage.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 text-xs px-3 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#137fec]/90 transition-colors font-medium">
                        📍 Xem trên bản đồ
                      </button>
                      <button className="flex-1 text-xs px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                        📊 Chi tiết báo cáo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {damageData.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Không có dữ liệu thiệt hại</p>
          </div>
        )}
      </div>
    </div>
  );
}
