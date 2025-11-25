'use client';

import { useState, useEffect } from 'react';
import { getDamageByStorm, getLatestDamageByStorm, type DamageAssessment, normalizeSources } from '../../services/damageApi';

type DamageTabProps = {
  stormId?: string;
  onDamageClick?: (damage: DamageAssessment) => void;
};

export default function DamageTab({ stormId, onDamageClick }: DamageTabProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [damageData, setDamageData] = useState<DamageAssessment[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch damage data from API
  useEffect(() => {
    const fetchDamage = async () => {
      if (!stormId) {
        setDamageData([]);
        return;
      }

      try {
        setLoading(true);
        const data = await getDamageByStorm(stormId);
        setDamageData(data);
      } catch (error) {
        console.error('Failed to fetch damage data:', error);
        setDamageData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDamage();
  }, [stormId]);

  const handleDamageClick = (damage: DamageAssessment) => {
    setExpandedId(expandedId === damage.id ? null : damage.id);
    onDamageClick?.(damage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString('vi-VN');
  };

  const getSeverityColor = (deaths: number | null, injured: number | null) => {
    const totalAffected = (deaths || 0) + (injured || 0);
    if (totalAffected >= 50) return { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400', icon: '🔴' };
    if (totalAffected >= 25) return { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-400', icon: '🟠' };
    if (totalAffected >= 10) return { bg: 'bg-yellow-500/10', border: 'border-yellow-500', text: 'text-yellow-400', icon: '🟡' };
    return { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-400', icon: '🔵' };
  };

  // Calculate totals from latest damage assessment
  const latestDamage = damageData.length > 0 ? damageData[0] : null;
  const totalDeaths = latestDamage?.detail.casualties.deaths || 0;
  // removed missing-persons summary per request
  const totalInjured = latestDamage?.detail.casualties.injured || 0;
  const totalEconomicLoss = latestDamage?.detail.total_economic_loss_vnd || 0;

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải dữ liệu thiệt hại...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="px-4 py-4 space-y-4">
        {/* Header with Summary */}
        {latestDamage && (
          <div className="bg-[#1c2127] rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-bold text-white mb-3">📊 Tổng quan thiệt hại</h2>
            
            {/* Casualties Summary */}
              <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-400">{formatNumber(totalDeaths)}</div>
                <div className="text-xs text-gray-400">💀 Tử vong</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <div className="text-2xl font-bold text-orange-400">{formatNumber(totalInjured)}</div>
                <div className="text-xs text-gray-400">🤕 Bị thương</div>
              </div>
            </div>

            {/* Economic Loss */}
            {totalEconomicLoss > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{formatNumber(totalEconomicLoss)} tỷ đồng</div>
                <div className="text-xs text-gray-400">💰 Tổng thiệt hại kinh tế</div>
              </div>
            )}

            {/* Summary */}
            {latestDamage.detail.summary && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm text-gray-300 italic">"{latestDamage.detail.summary}"</p>
              </div>
            )}
          </div>
        )}

        {/* Damage Assessment List */}
        <div className="flex flex-col gap-3">
          {damageData.map((damage) => {
            if (!damage || !damage.detail) return null;
            
            const { casualties, property, infrastructure, agriculture } = damage.detail;
            const colors = getSeverityColor(casualties.deaths || 0, casualties.injured || 0);
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
                        {damage.location_name || `Thiệt hại #${damage.id}`}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-400">
                        {formatDate(damage.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-3 text-xs">
                    {(casualties.deaths ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-red-400">
                        💀 {casualties.deaths}
                      </span>
                    )}
                    {(casualties.injured ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-orange-400">
                        🤕 {casualties.injured}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className={`px-3 pb-3 pt-2 border-t ${colors.border}/20 space-y-3`}>
                    {/* Property Damage */}
                    {((property.houses_damaged ?? 0) > 0 || (property.houses_flooded ?? 0) > 0 || (property.boats_damaged ?? 0) > 0) && (
                      <div className="bg-black/30 rounded p-2 space-y-1">
                        <h4 className="text-white font-semibold text-xs">🏠 Tài sản</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {(property.houses_damaged ?? 0) > 0 && (
                            <div className="text-center">
                              <div className="text-white font-bold">{formatNumber(property.houses_damaged)}</div>
                              <div className="text-gray-400 text-[10px]">Nhà hư</div>
                            </div>
                          )}
                          {(property.houses_flooded ?? 0) > 0 && (
                            <div className="text-center">
                              <div className="text-white font-bold">{formatNumber(property.houses_flooded)}</div>
                              <div className="text-gray-400 text-[10px]">Nhà ngập</div>
                            </div>
                          )}
                          {(property.boats_damaged ?? 0) > 0 && (
                            <div className="text-center">
                              <div className="text-white font-bold">{formatNumber(property.boats_damaged)}</div>
                              <div className="text-gray-400 text-[10px]">Tàu thuyền</div>
                            </div>
                          )}
                        </div>
                        {property.description && (
                          <p className="text-gray-400 text-xs italic">{property.description}</p>
                        )}
                      </div>
                    )}

                    {/* Infrastructure */}
                    {infrastructure.description && (
                      <div className="bg-black/30 rounded p-2 space-y-1">
                        <h4 className="text-white font-semibold text-xs">🏗️ Cơ sở hạ tầng</h4>
                        <p className="text-gray-400 text-xs">{infrastructure.description}</p>
                      </div>
                    )}

                    {/* Agriculture */}
                    {((agriculture.crop_area_damaged_ha ?? 0) > 0 || (agriculture.livestock_lost ?? 0) > 0) && (
                      <div className="bg-black/30 rounded p-2 space-y-1">
                        <h4 className="text-white font-semibold text-xs">🌾 Nông nghiệp</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {(agriculture.crop_area_damaged_ha ?? 0) > 0 && (
                            <div>
                              <div className="text-white font-bold">{formatNumber(agriculture.crop_area_damaged_ha)} ha</div>
                              <div className="text-gray-400 text-[10px]">Cây trồng</div>
                            </div>
                          )}
                          {(agriculture.livestock_lost ?? 0) > 0 && (
                            <div>
                              <div className="text-white font-bold">{formatNumber(agriculture.livestock_lost)}</div>
                              <div className="text-gray-400 text-[10px]">Gia súc</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Economic Loss */}
                    {(damage.detail.total_economic_loss_vnd ?? 0) > 0 && (
                      <div className="bg-purple-500/20 border border-purple-500/30 rounded p-2 text-center">
                        <div className="text-purple-400 font-bold text-sm">
                          {formatNumber(damage.detail.total_economic_loss_vnd)} tỷ đồng
                        </div>
                        <div className="text-gray-400 text-[10px]">💰 Thiệt hại kinh tế</div>
                      </div>
                    )}

                    {/* Sources */}
                    {damage.detail.sources && damage.detail.sources.length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-teal-400 hover:text-teal-300 font-medium">
                          📰 Nguồn tin ({damage.detail.sources.length})
                        </summary>
                        <div className="mt-2 space-y-1 bg-black/20 rounded p-2">
                          {normalizeSources(damage.detail.sources).map((source, idx) => (
                            <div key={idx} className="text-[10px]">
                              {source.url ? (
                                <a 
                                  href={source.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-teal-400 hover:text-teal-300 underline flex items-center gap-1"
                                >
                                  🔗 {source.name}
                                </a>
                              ) : (
                                <p className="text-gray-300">{source.name}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
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
