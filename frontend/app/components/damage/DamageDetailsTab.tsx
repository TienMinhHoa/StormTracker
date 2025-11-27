'use client';

import { useState, useEffect } from 'react';
import { getDamageDetailsByStorm, type DamageDetailRecord } from '../../services/damageDetailsApi';

type DamageDetailsTabProps = {
  stormId?: string;
  onLocationClick?: (detail: DamageDetailRecord) => void;
  showMarkers?: boolean;
  onShowMarkersChange?: (show: boolean) => void;
};

export default function DamageDetailsTab({ 
  stormId, 
  onLocationClick,
  showMarkers = true,
  onShowMarkersChange
}: DamageDetailsTabProps) {
  const [damageDetails, setDamageDetails] = useState<DamageDetailRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch damage details from API
  useEffect(() => {
    const fetchDamageDetails = async () => {
      console.log('🔍 DamageDetailsTab - stormId:', stormId);
      if (!stormId) {
        console.log('⚠️ DamageDetailsTab - No stormId provided');
        setDamageDetails([]);
        return;
      }

      try {
        setLoading(true);
        console.log(`🔄 Fetching damage details for storm: ${stormId}`);
        const data = await getDamageDetailsByStorm(stormId);
        setDamageDetails(data);
        console.log(`✅ Loaded ${data.length} damage detail records for storm ${stormId}`);
      } catch (error) {
        console.error('Failed to fetch damage details:', error);
        setDamageDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDamageDetails();
  }, [stormId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDamageCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      flooding: '🌊',
      wind_damage: '💨',
      infrastructure: '🏗️',
      agriculture: '🌾',
      casualties: '💀',
      evacuated: '🚶',
      economic: '💰',
      general: '📋'
    };
    return icons[category] || '📌';
  };

  const getDamageCategoryName = (category: string): string => {
    const names: Record<string, string> = {
      flooding: 'Ngập lụt',
      wind_damage: 'Gió bão',
      infrastructure: 'Hạ tầng',
      agriculture: 'Nông nghiệp',
      casualties: 'Thương vong',
      evacuated: 'Sơ tán',
      economic: 'Kinh tế',
      general: 'Chung'
    };
    return names[category] || category;
  };

  const getDamageCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      casualties: { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400' },
      flooding: { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-400' },
      wind_damage: { bg: 'bg-cyan-500/10', border: 'border-cyan-500', text: 'text-cyan-400' },
      infrastructure: { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-400' },
      agriculture: { bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-400' },
      evacuated: { bg: 'bg-yellow-500/10', border: 'border-yellow-500', text: 'text-yellow-400' },
      economic: { bg: 'bg-purple-500/10', border: 'border-purple-500', text: 'text-purple-400' },
    };
    return colors[category] || { bg: 'bg-gray-500/10', border: 'border-gray-500', text: 'text-gray-400' };
  };

  const handleLocationClick = (detail: DamageDetailRecord) => {
    setExpandedId(expandedId === detail.id ? null : detail.id);
    onLocationClick?.(detail);
  };

  // Get all unique damage categories from all records
  const allCategories = new Set<string>();
  damageDetails.forEach(detail => {
    Object.keys(detail.content.damages).forEach(category => {
      allCategories.add(category);
    });
  });

  // Filter damage details by category
  const filteredDetails = selectedCategory === 'all' 
    ? damageDetails 
    : damageDetails.filter(detail => detail.content.damages[selectedCategory]);

  // Calculate summary statistics
  const totalLocations = damageDetails.length;
  const casualtyRecords = damageDetails.filter(d => d.content.damages.casualties).length;
  const economicRecords = damageDetails.filter(d => d.content.damages.economic).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải chi tiết thiệt hại...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Summary Statistics */}
        {damageDetails.length > 0 && (
          <div className="bg-[#1c2127] rounded-lg p-4">
            <h2 className="text-lg font-bold text-white mb-3">📊 Tổng quan chi tiết</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-teal-400">{totalLocations}</div>
                <div className="text-xs text-gray-400">📍 Địa điểm</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{casualtyRecords}</div>
                <div className="text-xs text-gray-400">💀 Có thương vong</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{economicRecords}</div>
                <div className="text-xs text-gray-400">💰 Có thiệt hại KT</div>
              </div>
            </div>
          </div>
        )}

        {/* Marker Toggle */}
        <div className="bg-[#1c2127] rounded-lg p-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={(e) => onShowMarkersChange?.(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-gray-900"
            />
            <span className="text-sm text-gray-300">
              Hiển thị marker chi tiết thiệt hại trên bản đồ
            </span>
          </label>
        </div>

        {/* Category Filter */}
        <div className="bg-[#1c2127] rounded-lg p-3">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🏷️ Lọc theo loại thiệt hại
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          >
            <option value="all">Tất cả ({damageDetails.length})</option>
            {Array.from(allCategories).sort().map(category => {
              const count = damageDetails.filter(d => d.content.damages[category]).length;
              return (
                <option key={category} value={category}>
                  {getDamageCategoryIcon(category)} {getDamageCategoryName(category)} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Damage Details List */}
        {filteredDetails.length > 0 ? (
          <div className="space-y-3">
            {filteredDetails.map((detail) => {
              const isExpanded = expandedId === detail.id;
              const { location_name, latitude, longitude, damages } = detail.content;
              
              // Determine primary category for color
              const primaryCategory = damages.casualties ? 'casualties' 
                : damages.flooding ? 'flooding'
                : damages.wind_damage ? 'wind_damage'
                : damages.economic ? 'economic'
                : Object.keys(damages)[0];
              
              const colors = getDamageCategoryColor(primaryCategory);

              return (
                <div
                  key={detail.id}
                  className={`${colors.bg} border-l-4 ${colors.border} rounded-r-lg overflow-hidden`}
                >
                  <div
                    className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleLocationClick(detail)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📍</span>
                        <h3 className={`font-bold ${colors.text} text-sm`}>
                          {location_name}
                        </h3>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(detail.created_at)}
                      </span>
                    </div>

                    {/* Coordinates */}
                    <div className="text-xs text-gray-500 mb-2">
                      🌐 {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                    </div>

                    {/* Quick damage categories */}
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(damages).map(category => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-black/30 rounded text-xs text-gray-300"
                        >
                          {getDamageCategoryIcon(category)} {getDamageCategoryName(category)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className={`px-3 pb-3 pt-2 border-t ${colors.border}/20 space-y-2`}>
                      {Object.entries(damages).map(([category, description]) => {
                        const categoryColors = getDamageCategoryColor(category);
                        return (
                          <div
                            key={category}
                            className={`${categoryColors.bg} border ${categoryColors.border}/30 rounded-lg p-3`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{getDamageCategoryIcon(category)}</span>
                              <h4 className={`font-semibold text-sm ${categoryColors.text}`}>
                                {getDamageCategoryName(category)}
                              </h4>
                            </div>
                            <p className="text-gray-300 text-xs leading-relaxed">
                              {String(description)}
                            </p>
                          </div>
                        );
                      })}

                      {/* Location Key Info */}
                      <div className="bg-black/30 rounded p-2 mt-3">
                        <p className="text-xs text-gray-400">
                          <span className="font-medium">Location Key:</span> {detail.content.location_key}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          <span className="font-medium">ID:</span> {detail.id}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">
              {selectedCategory === 'all' 
                ? 'Chưa có dữ liệu chi tiết thiệt hại'
                : `Không có thiệt hại loại "${getDamageCategoryName(selectedCategory)}"`
              }
            </p>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="mt-2 text-teal-400 hover:text-teal-300 text-xs"
              >
                Xem tất cả
              </button>
            )}
          </div>
        )}
    </>
  );
}
