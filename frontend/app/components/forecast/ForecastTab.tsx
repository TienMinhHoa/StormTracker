'use client';

import { useState, useEffect } from 'react';
import NewsDetail from '../news/NewsDetail';
import { NewsItem } from '../news/newsData';
import { getNewsByStorm, type News } from '../../services/newsApi';
import { getWarnings, getRiskColor, getRiskIcon, type Warning, type RiskLevel } from '../../services/warningApi';
import SafeBackgroundImage from '../common/SafeBackgroundImage';

type ForecastTabProps = {
  onNewsClick?: (news: NewsItem) => void;
  selectedNewsId?: number | null;
  stormId?: string;
  showNewsMarkers?: boolean;
  onShowNewsMarkersChange?: (show: boolean) => void;
  onWarningClick?: (warning: Warning) => void;
  selectedWarning?: Warning | null;
  showWarningMarkers?: boolean;
  onShowWarningMarkersChange?: (show: boolean) => void;
};

// Convert API News to NewsItem format
const convertNewsToNewsItem = (news: News): NewsItem => ({
  id: news.news_id,
  title: news.title,
  image: news.thumbnail_url || `https://picsum.photos/400/300?random=${news.news_id}`,
  coordinates: [news.lon, news.lat],
  category: 'Dự báo & Cảnh báo',
  date: new Date(news.published_at).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }),
  author: 'Nguồn tin tức',
  content: news.content,
  source_url: news.source_url,
});

export default function ForecastTab({ 
  onNewsClick, 
  selectedNewsId, 
  stormId,
  showNewsMarkers = true,
  onShowNewsMarkersChange,
  onWarningClick,
  selectedWarning,
  showWarningMarkers = true,
  onShowWarningMarkersChange
}: ForecastTabProps) {
  const [activeSection, setActiveSection] = useState<'forecast' | 'flood'>('forecast');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [errorNews, setErrorNews] = useState<string | null>(null);

  // Warning states
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loadingWarnings, setLoadingWarnings] = useState(false);
  const [errorWarnings, setErrorWarnings] = useState<string | null>(null);
  const [expandedWarningId, setExpandedWarningId] = useState<number | null>(null);
  const [collapsedProvinces, setCollapsedProvinces] = useState<Set<string>>(new Set());

  // Fetch storm forecast news
  useEffect(() => {
    const fetchNews = async () => {
      if (!stormId) {
        setNewsItems([]);
        return;
      }

      try {
        setLoadingNews(true);
        setErrorNews(null);
        const newsData = await getNewsByStorm(stormId, 0, 100);
        // Filter only forecast/warning category
        const forecastNews = newsData.filter(n => n.category === 'Du_bao_Canh_bao_bao');
        const converted = forecastNews.map(convertNewsToNewsItem);
        setNewsItems(converted);
      } catch (err) {
        console.error('❌ Failed to load forecast news:', err);
        setErrorNews('Không thể tải tin dự báo');
        setNewsItems([]);
      } finally {
        setLoadingNews(false);
      }
    };

    fetchNews();
  }, [stormId]);

  // Fetch flood warnings
  useEffect(() => {
    const fetchWarnings = async () => {
      try {
        setLoadingWarnings(true);
        setErrorWarnings(null);
        const data = await getWarnings(6);
        setWarnings(data);
        // Collapse all provinces by default
        const allProvinces = new Set(data.map(w => w.provinceName));
        setCollapsedProvinces(allProvinces);
      } catch (err) {
        console.error('❌ Failed to load warnings:', err);
        setErrorWarnings('Không thể tải cảnh báo ngập lụt');
        setWarnings([]);
      } finally {
        setLoadingWarnings(false);
      }
    };

    fetchWarnings();
  }, []);

  // Update selectedNews when selectedNewsId changes
  useEffect(() => {
    if (selectedNewsId && newsItems.length > 0) {
      const news = newsItems.find(item => item.id === selectedNewsId);
      if (news) {
        setSelectedNews(news);
        setActiveSection('forecast');
      }
    }
  }, [selectedNewsId, newsItems]);

  // Expand warning when selected from map
  useEffect(() => {
    if (selectedWarning) {
      setActiveSection('flood');
      if (collapsedProvinces.has(selectedWarning.provinceName)) {
        toggleProvince(selectedWarning.provinceName);
      }
      setExpandedWarningId(selectedWarning.id);
    }
  }, [selectedWarning]);

  const handleNewsClick = (news: NewsItem) => {
    setSelectedNews(news);
    onNewsClick?.(news);
  };

  const handleBack = () => {
    setSelectedNews(null);
  };

  const handleWarningClick = (warning: Warning) => {
    if (collapsedProvinces.has(warning.provinceName)) {
      toggleProvince(warning.provinceName);
    }
    setExpandedWarningId(expandedWarningId === warning.id ? null : warning.id);
    onWarningClick?.(warning);
  };

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

  const getUniqueKey = (warning: Warning) => {
    return `${warning.id}-${warning.commune_id}-${warning.commune_id_2cap}`;
  };

  // No filters - show all warnings
  const filteredWarnings = warnings;

  // Group warnings by province
  const groupedByProvince = filteredWarnings.reduce((acc, warning) => {
    const province = warning.provinceName;
    if (!acc[province]) {
      acc[province] = [];
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show detail view if a news item is selected
  if (selectedNews) {
    return <NewsDetail news={selectedNews} onBack={handleBack} />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Section Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSection('forecast')}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeSection === 'forecast'
                  ? 'bg-[#137fec] text-white shadow-lg'
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
              }`}
            >
              🌪️ Dự báo & Cảnh báo bão
            </button>
            <button
              onClick={() => setActiveSection('flood')}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeSection === 'flood'
                  ? 'bg-[#137fec] text-white shadow-lg'
                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
              }`}
            >
              🌊 Cảnh báo ngập lụt & sạt lở
            </button>
          </div>

          {/* Forecast Section */}
          {activeSection === 'forecast' && (
            <>
              {/* Marker Toggle */}
              {onShowNewsMarkersChange && (
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Hiển thị marker</span>
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
              )}

              {loadingNews && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-400 text-sm">Đang tải dự báo...</div>
                </div>
              )}

              {errorNews && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-red-400 text-sm">{errorNews}</div>
                </div>
              )}

              {!loadingNews && !errorNews && (
                newsItems.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-400 text-sm">Không có tin dự báo</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {newsItems.map((item) => (
                      <div key={item.id} className="flex flex-col gap-2">
                        <button
                          onClick={() => handleNewsClick(item)}
                          className="block group w-full text-left"
                        >
                          <SafeBackgroundImage
                            src={item.image}
                            className="aspect-video w-full rounded-lg bg-cover bg-center bg-gray-800 group-hover:opacity-80 transition-opacity"
                          />
                        </button>
                        <button
                          onClick={() => handleNewsClick(item)}
                          className="text-left group"
                        >
                          <h3 className="text-sm font-medium leading-snug text-white group-hover:text-[#137fec] transition-colors">
                            {item.title}
                          </h3>
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}

          {/* Flood Warning Section */}
          {activeSection === 'flood' && (
            <>
              {/* Marker Toggle */}
              {onShowWarningMarkersChange && (
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Hiển thị marker</span>
                    <button
                      onClick={() => onShowWarningMarkersChange(!showWarningMarkers)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showWarningMarkers ? 'bg-[#137fec]' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showWarningMarkers ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {loadingWarnings && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-400 text-sm">Đang tải cảnh báo...</div>
                </div>
              )}

              {errorWarnings && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-red-400 text-sm">{errorWarnings}</div>
                </div>
              )}

              {!loadingWarnings && !errorWarnings && (
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
                          const isExpanded = expandedWarningId === warning.id;
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

                              {isExpanded && (
                                <div className={`px-3 pb-3 pt-2 border-t ${colors.border}/20 space-y-2`}>
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
