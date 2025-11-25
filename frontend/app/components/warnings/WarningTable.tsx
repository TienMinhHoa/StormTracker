'use client';

import React, { useState, useEffect } from 'react';
import { getWarnings, getRiskColor, getRiskIcon, type Warning, type RiskLevel } from '../../services/warningApi';

type WarningTableProps = {
  onWarningClick?: (warning: Warning) => void;
  externalSelectedWarning?: Warning | null;
};

export default function WarningTable({ onWarningClick, externalSelectedWarning }: WarningTableProps) {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastHours, setForecastHours] = useState(6);
  const [filterRisk, setFilterRisk] = useState<'all' | RiskLevel>('all');
  const [sortBy, setSortBy] = useState<'location' | 'rainfall' | 'risk'>('risk');
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

  // Filter and sort warnings
  const getMaxRiskLevel = (warning: Warning): RiskLevel => {
    if (warning.nguycosatlo === 'Rất cao' || warning.nguycoluquet === 'Rất cao') return 'Rất cao';
    if (warning.nguycosatlo === 'Cao' || warning.nguycoluquet === 'Cao') return 'Cao';
    if (warning.nguycosatlo === 'Trung bình' || warning.nguycoluquet === 'Trung bình') return 'Trung bình';
    if (warning.nguycosatlo === 'Thấp' || warning.nguycoluquet === 'Thấp') return 'Thấp';
    return '';
  };

  const getRiskPriority = (level: RiskLevel): number => {
    switch (level) {
      case 'Rất cao': return 4;
      case 'Cao': return 3;
      case 'Trung bình': return 2;
      case 'Thấp': return 1;
      default: return 0;
    }
  };

  let filteredWarnings = warnings.filter(w => {
    if (filterRisk === 'all') return true;
    return getMaxRiskLevel(w) === filterRisk;
  });

  // Group by province and deduplicate by commune + district
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

  // Sort warnings within each province
  Object.keys(groupedByProvince).forEach(province => {
    groupedByProvince[province].sort((a, b) => {
      if (sortBy === 'risk') {
        return getRiskPriority(getMaxRiskLevel(b)) - getRiskPriority(getMaxRiskLevel(a));
      } else if (sortBy === 'rainfall') {
        return b.luongmuatd_db - a.luongmuatd_db;
      } else {
        return a.district_name.localeCompare(b.district_name);
      }
    });
  });

  const provinces = Object.keys(groupedByProvince).sort();

  // Statistics
  const stats = {
    total: warnings.length,
    ratCao: warnings.filter(w => getMaxRiskLevel(w) === 'Rất cao').length,
    cao: warnings.filter(w => getMaxRiskLevel(w) === 'Cao').length,
    trungBinh: warnings.filter(w => getMaxRiskLevel(w) === 'Trung bình').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading && warnings.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải dữ liệu cảnh báo...</p>
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
        {/* Header */}
        <div className="bg-[#1c2127] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">📊 Bảng cảnh báo thiên tai</h2>
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

          {/* Current Date/Time */}
          <div className="text-xs text-gray-400">
            📅 Dữ liệu ngày: <span className="text-white font-medium">{formatDateTime(new Date().toISOString())}</span>
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

        {/* Filters and Sort */}
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as any)}
            className="flex-1 bg-[#1c2127] border border-gray-600 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="Rất cao">🔴 Rất cao</option>
            <option value="Cao">🟠 Cao</option>
            <option value="Trung bình">🟡 Trung bình</option>
            <option value="Thấp">🟢 Thấp</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 bg-[#1c2127] border border-gray-600 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="risk">Sắp xếp: Mức độ nguy hiểm</option>
            <option value="rainfall">Sắp xếp: Lượng mưa</option>
            <option value="location">Sắp xếp: Vị trí</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#1c2127] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#101922] text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">STT</th>
                  <th className="px-3 py-2 text-left font-semibold">Khu vực</th>
                  <th className="px-3 py-2 text-center font-semibold">🏔️ Sạt lở</th>
                  <th className="px-3 py-2 text-center font-semibold">🌊 Lũ quét</th>
                  <th className="px-3 py-2 text-center font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredWarnings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                      Không có dữ liệu cảnh báo
                    </td>
                  </tr>
                ) : (
                  provinces.map((province) => {
                    let counter = 0;
                    return (
                      <React.Fragment key={province}>
                        {/* Province Header Row */}
                        <tr 
                          className="bg-teal-500/10 border-t-2 border-teal-500 cursor-pointer hover:bg-teal-500/20 transition-colors"
                          onClick={() => toggleProvince(province)}
                        >
                          <td colSpan={5} className="px-3 py-2">
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
                                <span className="text-teal-400 font-bold text-sm">🏛️ {province}</span>
                              </div>
                              <span className="text-gray-400 text-xs">{groupedByProvince[province].length} khu vực</span>
                            </div>
                          </td>
                        </tr>
                        {/* Warnings in this province */}
                        {!collapsedProvinces.has(province) && groupedByProvince[province].map((warning) => {
                          counter++;
                          const maxRisk = getMaxRiskLevel(warning);
                          const colors = getRiskColor(maxRisk);
                          const uniqueKey = getUniqueKey(warning);

                          return (
                            <tr 
                              key={uniqueKey}
                              className="hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5"
                              onClick={() => {
                                // Expand province when clicking on warning
                                if (collapsedProvinces.has(province)) {
                                  toggleProvince(province);
                                }
                                onWarningClick?.(warning);
                              }}
                            >
                              <td className="px-3 py-3 text-gray-400">{counter}</td>
                              <td className="px-3 py-3">
                                <div className="text-white font-medium">{warning.commune_name}</div>
                                <div className="text-gray-400 text-[10px]">{warning.district_name}</div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                {warning.nguycosatlo ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${colors.bg} ${colors.text} font-medium`}>
                                    {getRiskIcon(warning.nguycosatlo)} {warning.nguycosatlo}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {warning.nguycoluquet ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${colors.bg} ${colors.text} font-medium`}>
                                    {getRiskIcon(warning.nguycoluquet)} {warning.nguycoluquet}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Expand province when clicking button
                                    if (collapsedProvinces.has(province)) {
                                      toggleProvince(province);
                                    }
                                    onWarningClick?.(warning);
                                  }}
                                  className="px-2 py-1 bg-teal-600 hover:bg-teal-700 rounded text-white transition-colors"
                                >
                                  Xem
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        {filteredWarnings.length > 0 && (
          <div className="text-xs text-gray-400 text-center">
            Hiển thị <span className="text-white font-medium">{filteredWarnings.length}</span> khu vực có nguy cơ
          </div>
        )}
      </div>
    </div>
  );
}
