'use client';

import { useState, useEffect } from 'react';
import { getWarnings, getRiskColor, getRiskIcon, type Warning, type RiskLevel } from '../../services/warningApi';

type WarningTabProps = {
  onWarningClick?: (warning: Warning) => void;
  externalSelectedWarning?: Warning | null;
};

export default function WarningTab({ onWarningClick, externalSelectedWarning }: WarningTabProps) {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastHours, setForecastHours] = useState(6);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterRisk, setFilterRisk] = useState<'all' | RiskLevel>('all');
  const [filterType, setFilterType] = useState<'all' | 'satlo' | 'luquet'>('all');
  const [collapsedProvinces, setCollapsedProvinces] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWarnings();
  }, [forecastHours]);

  // Expand province when external warning is selected (from map marker)
  useEffect(() => {
    if (externalSelectedWarning && collapsedProvinces.has(externalSelectedWarning.provinceName)) {
      setCollapsedProvinces(prev => {
        const newSet = new Set(prev);
        newSet.delete(externalSelectedWarning.provinceName);
        return newSet;
      });
      setExpandedId(externalSelectedWarning.id);
    }
  }, [externalSelectedWarning]);

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWarnings(forecastHours);
      setWarnings(data);
      // Collapse all provinces by default
      const allProvinces = new Set(data.map(w => w.provinceName));
      setCollapsedProvinces(allProvinces);
    } catch (err) {
      setError('Không thể tải dữ liệu cảnh báo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWarningClick = (warning: Warning) => {
    // Expand province if collapsed
    if (collapsedProvinces.has(warning.provinceName)) {
      toggleProvince(warning.provinceName);
    }
    setExpandedId(expandedId === warning.id ? null : warning.id);
    onWarningClick?.(warning);
  };

  // Generate unique key for warnings (API returns duplicate IDs)
  const getUniqueKey = (warning: Warning) => {
    return `${warning.id}-${warning.commune_id}-${warning.commune_id_2cap}`;
  };

  // Toggle province collapse
  const toggleProvince = (province: string) => {
    setCollapsedProvinces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(province)) {
        newSet.delete(province);
      } else {
        newSet.add(province);
      }
      return newSet;
    });
  };

  // Filter warnings
  const filteredWarnings = warnings.filter(w => {
    if (filterRisk !== 'all') {
      const hasMatchingRisk = w.nguycosatlo === filterRisk || w.nguycoluquet === filterRisk;
      if (!hasMatchingRisk) return false;
    }
    
    if (filterType === 'satlo' && !w.nguycosatlo) return false;
    if (filterType === 'luquet' && !w.nguycoluquet) return false;
    
    return true;
  });

  // Group warnings by province and deduplicate by commune + district
  const groupedByProvince = filteredWarnings.reduce((acc, warning) => {
    const province = warning.provinceName;
    if (!acc[province]) {
      acc[province] = [];
    }
    
    // Check if this commune-district combination already exists
    const key = `${warning.commune_name}-${warning.district_name}`;
    const exists = acc[province].some(w => 
      `${w.commune_name}-${w.district_name}` === key
    );
    
    if (!exists) {
      acc[province].push(warning);
    }
    return acc;
  }, {} as Record<string, Warning[]>);

  const provinces = Object.keys(groupedByProvince).sort();

  // Statistics
  const stats = {
    total: warnings.length,
    ratCao: warnings.filter(w => w.nguycosatlo === 'Rất cao' || w.nguycoluquet === 'Rất cao').length,
    cao: warnings.filter(w => w.nguycosatlo === 'Cao' || w.nguycoluquet === 'Cao').length,
    trungBinh: warnings.filter(w => w.nguycosatlo === 'Trung bình' || w.nguycoluquet === 'Trung bình').length,
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

  if (loading && warnings.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải cảnh báo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="mb-4">⚠️ {error}</p>
          <button
            onClick={fetchWarnings}
            className="px-4 py-2 bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="px-4 py-4 space-y-4">
        {/* Header with Statistics */}
        <div className="bg-[#1c2127] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">⚠️ Cảnh báo thiên tai</h2>
            <button
              onClick={fetchWarnings}
              className="p-2 hover:bg-white/5 rounded transition-colors"
              disabled={loading}
            >
              <svg className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Fixed 6-hour forecast */}
          <div className="text-xs text-gray-400">
            ⏱️ Dự báo: <span className="text-teal-400 font-medium">6 giờ tiếp theo</span>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-2">
              <div className="text-xl font-bold text-white">{stats.total}</div>
              <div className="text-[10px] text-gray-400">Tổng</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              <div className="text-xl font-bold text-red-400">{stats.ratCao}</div>
              <div className="text-[10px] text-gray-400">🔴 Rất cao</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
              <div className="text-xl font-bold text-orange-400">{stats.cao}</div>
              <div className="text-[10px] text-gray-400">🟠 Cao</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
              <div className="text-xl font-bold text-yellow-400">{stats.trungBinh}</div>
              <div className="text-[10px] text-gray-400">🟡 TB</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRisk('all')}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                filterRisk === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'bg-[#1c2127] text-gray-400 hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterRisk('Rất cao')}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                filterRisk === 'Rất cao'
                  ? 'bg-red-600 text-white'
                  : 'bg-[#1c2127] text-gray-400 hover:text-white'
              }`}
            >
              🔴 Rất cao
            </button>
            <button
              onClick={() => setFilterRisk('Cao')}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                filterRisk === 'Cao'
                  ? 'bg-orange-600 text-white'
                  : 'bg-[#1c2127] text-gray-400 hover:text-white'
              }`}
            >
              🟠 Cao
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                filterType === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'bg-[#1c2127] text-gray-400 hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('satlo')}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                filterType === 'satlo'
                  ? 'bg-teal-600 text-white'
                  : 'bg-[#1c2127] text-gray-400 hover:text-white'
              }`}
            >
              🏔️ Sạt lở
            </button>
            <button
              onClick={() => setFilterType('luquet')}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                filterType === 'luquet'
                  ? 'bg-teal-600 text-white'
                  : 'bg-[#1c2127] text-gray-400 hover:text-white'
              }`}
            >
              🌊 Lũ quét
            </button>
          </div>
        </div>

        {/* Warning List - Grouped by Province */}
        <div className="flex flex-col gap-3">
          {filteredWarnings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Không có cảnh báo phù hợp</p>
            </div>
          ) : (
            provinces.map((province) => (
              <div key={province} className="space-y-2">
                {/* Province Header */}
                <div 
                  className="sticky top-0 bg-[#101922] px-3 py-2 rounded-lg border border-teal-500/30 z-10 cursor-pointer hover:bg-teal-500/10 transition-colors"
                  onClick={() => toggleProvince(province)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg 
                        className={`w-4 h-4 text-teal-400 transition-transform ${
                          collapsedProvinces.has(province) ? '-rotate-90' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <h3 className="text-sm font-bold text-teal-400">🏛️ {province}</h3>
                    </div>
                    <span className="text-xs text-gray-400">{groupedByProvince[province].length} khu vực</span>
                  </div>
                </div>

                {/* Warnings in this province */}
                {!collapsedProvinces.has(province) && groupedByProvince[province].map((warning) => {
              const maxRisk = warning.nguycosatlo === 'Rất cao' || warning.nguycoluquet === 'Rất cao' ? 'Rất cao' :
                            warning.nguycosatlo === 'Cao' || warning.nguycoluquet === 'Cao' ? 'Cao' :
                            warning.nguycosatlo === 'Trung bình' || warning.nguycoluquet === 'Trung bình' ? 'Trung bình' : 'Thấp';
              const colors = getRiskColor(maxRisk as RiskLevel);
              const isExpanded = expandedId === warning.id;
              const uniqueKey = getUniqueKey(warning);

              return (
                <div
                  key={uniqueKey}
                  className={`${colors.bg} border-l-4 ${colors.border} rounded-r-lg overflow-hidden`}
                >
                  <div
                    className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleWarningClick(warning)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className={`font-bold ${colors.text} text-sm mb-1`}>
                          {warning.commune_name}, {warning.district_name}
                        </h3>
                        <p className="text-xs text-gray-400">{warning.provinceName}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">{formatDate(warning.thoigian)}</div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-3 text-xs">
                      {warning.nguycosatlo && (
                        <span className="flex items-center gap-1">
                          🏔️ <span className={getRiskColor(warning.nguycosatlo).text}>{warning.nguycosatlo}</span>
                        </span>
                      )}
                      {warning.nguycoluquet && (
                        <span className="flex items-center gap-1">
                          🌊 <span className={getRiskColor(warning.nguycoluquet).text}>{warning.nguycoluquet}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className={`px-3 pb-3 pt-2 border-t ${colors.border}/20 space-y-2`}>
                      {/* Risk Levels */}
                      <div className="bg-black/30 rounded p-2 space-y-1">
                        <h4 className="text-white font-semibold text-xs mb-2">⚠️ Mức độ nguy hiểm</h4>
                        {warning.nguycosatlo && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">🏔️ Sạt lở đất:</span>
                            <span className={`font-bold ${getRiskColor(warning.nguycosatlo).text}`}>
                              {getRiskIcon(warning.nguycosatlo)} {warning.nguycosatlo}
                            </span>
                          </div>
                        )}
                        {warning.nguycoluquet && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">🌊 Lũ quét:</span>
                            <span className={`font-bold ${getRiskColor(warning.nguycoluquet).text}`}>
                              {getRiskIcon(warning.nguycoluquet)} {warning.nguycoluquet}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Additional Info */}
                      <div className="text-xs text-gray-400">
                        <div className="flex justify-between">
                          <span>Nguồn dự báo:</span>
                          <span className="text-gray-300">{warning.nguonmuadubao}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cập nhật:</span>
                          <span className="text-gray-300">{formatDate(warning.ngay_capnhat)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
