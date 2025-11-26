'use client';

import { useState, useEffect } from 'react';
import { getRescueNewsByStorm, type News } from '../../services/newsApi';
import { getRescueRequestsByStorm, updateRescueRequest, type RescueRequestResponse } from '../../services/rescueApi';

// Extended interface for RescueTab component
export interface RescueRequest {
  id: number;
  name: string;
  phone: string;
  coordinates: [number, number]; // [lng, lat]
  address: string;
  category: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  numberOfPeople: number;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'safe_reported';
  timestamp: string;
  priority: number;
  verified: boolean;
  note?: string;
}

// Convert API response to RescueRequest format
const convertApiToRescueRequest = (apiRequest: RescueRequestResponse): RescueRequest => {
  // Map priority to urgency (1=critical, 2=high, 3=medium, 4-5=low)
  const priorityToUrgency = (priority: number): 'critical' | 'high' | 'medium' | 'low' => {
    if (priority <= 1) return 'critical';
    if (priority <= 2) return 'high';
    if (priority <= 3) return 'medium';
    return 'low';
  };

  // Get category from people_detail or default
  const category = apiRequest.people_detail?.category || 'other';
  const numberOfPeople = apiRequest.people_detail?.numberOfPeople || 1;

    return {
      id: apiRequest.request_id,
      name: apiRequest.name,
      phone: apiRequest.phone,
      coordinates: [apiRequest.lon, apiRequest.lat],
      address: apiRequest.address,
      category,
      urgency: priorityToUrgency(apiRequest.priority, apiRequest.status),
      numberOfPeople,
      description: apiRequest.note || 'Không có mô tả',
      status: apiRequest.status as 'pending' | 'in-progress' | 'completed' | 'safe_reported',
      timestamp: new Date(apiRequest.created_at).toLocaleString('vi-VN'),
      priority: apiRequest.priority,
      verified: apiRequest.verified,
      note: apiRequest.note,
    };
};
import RescueRequestForm from './RescueRequestForm';

const urgencyColors = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400', badge: 'bg-red-500' },
  high: { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-400', badge: 'bg-orange-500' },
  medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500', text: 'text-yellow-400', badge: 'bg-yellow-500' },
  low: { bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-400', badge: 'bg-green-500' },
};

// Map severity number to urgency level
const mapSeverityToUrgency = (severity: number): keyof typeof urgencyColors => {
  if (severity >= 5) return 'critical';
  if (severity >= 4) return 'high';
  if (severity >= 3) return 'medium';
  return 'low';
};

const statusLabels = {
  pending: 'Đang tiếp nhận',
  'in-progress': 'Đang cứu hộ',
  completed: 'Đã hỗ trợ',
  safe_reported: 'Báo an toàn',
};

const urgencyLabels = {
  critical: 'Cực kỳ khẩn cấp',
  high: 'Khẩn cấp',
  medium: 'Trung bình',
  low: 'Không khẩn',
};

const categoryIcons = {
  medical: '🏥',
  trapped: '🚧',
  'food-water': '🍽️',
  evacuation: '🚨',
  other: '❓',
};

type RescueTabProps = {
  onRescueClick?: (rescue: RescueRequest) => void;
  onRescueNewsClick?: (news: News) => void;
  stormId?: string | number;
  showRescueMarkers?: boolean;
  onShowRescueMarkersChange?: (show: boolean) => void;
  onShowRescueForm?: () => void;
};

export default function RescueTab({ onRescueClick, onRescueNewsClick, stormId, showRescueMarkers = true, onShowRescueMarkersChange, onShowRescueForm }: RescueTabProps) {
  const [activeSection, setActiveSection] = useState<'requests' | 'news'>('requests');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rescueNews, setRescueNews] = useState<News[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [rescueRequests, setRescueRequests] = useState<RescueRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Fetch rescue requests from API
  useEffect(() => {
    const fetchRescueRequests = async () => {
      if (!stormId || typeof stormId !== 'string') {
        setRescueRequests([]);
        return;
      }

      try {
        setLoadingRequests(true);
        const data = await getRescueRequestsByStorm(stormId, 0, 100);
        const converted = data.map(convertApiToRescueRequest);
        setRescueRequests(converted);
        console.log(`✅ Loaded ${converted.length} rescue requests`);
      } catch (error) {
        console.error('Failed to fetch rescue requests:', error);
        setRescueRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRescueRequests();
  }, [stormId]);

  // Fetch rescue news
  useEffect(() => {
    const fetchRescueNews = async () => {
      if (!stormId || typeof stormId !== 'string') {
        setRescueNews([]);
        return;
      }

      try {
        setLoadingNews(true);
        const data = await getRescueNewsByStorm(stormId);
        setRescueNews(data);
        console.log(`✅ Loaded ${data.length} rescue news items`);
      } catch (error) {
        console.error('Failed to fetch rescue news:', error);
        setRescueNews([]);
      } finally {
        setLoadingNews(false);
      }
    };

    fetchRescueNews();
  }, [stormId]);

  const handleRequestClick = (request: RescueRequest) => {
    setExpandedId(expandedId === request.id ? null : request.id);
    onRescueClick?.(request);
  };

  const handleRescueNewsClick = (news: News) => {
    onRescueNewsClick?.(news);
  };

  const handleUpdateStatus = async (requestId: number, newStatus: 'completed' | 'safe_reported') => {
    try {
      // Update status and priority to 5 (not urgent) when completed or safe_reported
      await updateRescueRequest(requestId, { 
        status: newStatus,
        priority: 5 // Set to not urgent when completed or safe
      });
      // Refresh the list
      if (stormId && typeof stormId === 'string') {
        const data = await getRescueRequestsByStorm(stormId, 0, 100);
        const converted = data.map(convertApiToRescueRequest);
        setRescueRequests(converted);
      }
      alert(`Đã cập nhật trạng thái thành công!`);
    } catch (error) {
      console.error('Failed to update rescue request:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  // Calculate statistics
  const stats = {
    pending: rescueRequests.filter(r => r.status === 'pending').length,
    completed: rescueRequests.filter(r => r.status === 'completed').length,
    safe_reported: rescueRequests.filter(r => r.status === 'safe_reported').length,
    totalPeople: rescueRequests
      .filter(r => r.status === 'completed' || r.status === 'safe_reported')
      .reduce((sum, r) => sum + r.numberOfPeople, 0),
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

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 py-4 space-y-4">
        {/* Section Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection('requests')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'requests'
                ? 'bg-red-600 text-white'
                : 'bg-[#1c2127] text-gray-400 hover:text-white'
            }`}
          >
            🚨 Cầu cứu ({rescueRequests.length})
          </button>
          <button
            onClick={() => setActiveSection('news')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'news'
                ? 'bg-red-600 text-white'
                : 'bg-[#1c2127] text-gray-400 hover:text-white'
            }`}
          >
            📰 Tình trạng cứu hộ ({rescueNews.length})
          </button>
        </div>

        {/* Requests Section */}
        {activeSection === 'requests' && (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#1c2127] rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Đang tiếp nhận</div>
                <div className="text-xl font-bold text-yellow-400">{stats.pending}</div>
              </div>
              <div className="bg-[#1c2127] rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Đã hỗ trợ</div>
                <div className="text-xl font-bold text-green-400">{stats.completed}</div>
              </div>
              <div className="bg-[#1c2127] rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Người được hỗ trợ</div>
                <div className="text-xl font-bold text-blue-400">{stats.totalPeople}</div>
              </div>
              <div className="bg-[#1c2127] rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Báo an toàn</div>
                <div className="text-xl font-bold text-teal-400">{stats.safe_reported}</div>
              </div>
            </div>

            {/* Header with Add Button - Centered */}
            <div className="flex items-center justify-center">
              <button
                onClick={() => onShowRescueForm?.()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Gửi cầu cứu
              </button>
            </div>

            {/* Marker Toggle */}
            {onShowRescueMarkersChange && (
              <div className="bg-[#1c2127] rounded-lg p-3 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRescueMarkers}
                    onChange={(e) => onShowRescueMarkersChange(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-red-500 focus:ring-red-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-sm text-gray-300">
                    Hiển thị marker cứu hộ trên bản đồ
                  </span>
                </label>
                
                {/* Legend for urgency levels */}
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-xs text-gray-400 mb-2">Chú thích mức độ khẩn cấp:</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500 border border-white"></div>
                      <span className="text-xs text-gray-300">Cực kỳ khẩn cấp (Ưu tiên 1)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500 border border-white"></div>
                      <span className="text-xs text-gray-300">Khẩn cấp (Ưu tiên 2)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500 border border-white"></div>
                      <span className="text-xs text-gray-300">Trung bình (Ưu tiên 3)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 border border-white"></div>
                      <span className="text-xs text-gray-300">Không khẩn (Ưu tiên 4-5)</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Số trên marker = Số người cần cứu hộ</p>
                </div>
              </div>
            )}

            {/* Rescue Requests List */}
            {loadingRequests ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Đang tải yêu cầu cứu hộ...</p>
                </div>
              </div>
            ) : rescueRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Không có yêu cầu cứu hộ nào</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {rescueRequests.map((request) => {
                  const colors = urgencyColors[request.urgency];
                  const isExpanded = expandedId === request.id;

                  return (
                    <div
                      key={request.id}
                      className={`${colors.bg} border-l-4 ${colors.border} rounded-r-lg overflow-hidden`}
                    >
                      <div
                        className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => handleRequestClick(request)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{categoryIcons[request.category]}</span>
                            <h3 className={`font-bold ${colors.text} text-sm`}>
                              {request.name}
                            </h3>
                          </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge} text-white font-medium`}>
                        {urgencyLabels[request.urgency]}
                      </span>
                      <span className="text-xs text-gray-400">{request.timestamp}</span>
                    </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span className="truncate">{request.address}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>👥 {request.numberOfPeople} người</span>
                          <span className={`px-2 py-0.5 rounded ${
                            request.status === 'pending' ? 'bg-gray-700' :
                            request.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {statusLabels[request.status]}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className={`px-3 pb-3 pt-2 border-t ${colors.border}/20`}>
                          <p className="text-sm text-gray-300 mb-3">
                            {request.description}
                          </p>
                          <div className="text-xs text-gray-400 mb-3 space-y-1">
                            <p>📞 Điện thoại: {request.phone}</p>
                            <p>📍 Tọa độ: {request.coordinates[1].toFixed(4)}°N, {request.coordinates[0].toFixed(4)}°E</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onRescueClick?.(request);
                              }}
                              className="flex-1 text-xs px-3 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#137fec]/90 transition-colors font-medium"
                            >
                              📍 Xem trên bản đồ
                            </button>
                            {request.status !== 'completed' && request.status !== 'safe_reported' && (
                              <>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(request.id, 'safe_reported');
                                  }}
                                  className="flex-1 text-xs px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                                >
                                  ✓ Báo an toàn
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(request.id, 'completed');
                                  }}
                                  className="flex-1 text-xs px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                  ✓ Đã hỗ trợ
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Rescue News Section */}
        {activeSection === 'news' && (
          <>
            {loadingNews ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Đang tải tin tức cứu hộ...</p>
                </div>
              </div>
            ) : rescueNews.length > 0 ? (
              <div className="space-y-3">
                {rescueNews.map((news) => (
                  <div
                    key={news.news_id}
                    onClick={() => handleRescueNewsClick(news)}
                    className="bg-[#1c2127] rounded-lg overflow-hidden hover:ring-2 hover:ring-red-500 transition-all cursor-pointer"
                  >
                    <div className="flex gap-3 p-3">
                      {news.thumbnail_url && (
                        <img
                          src={news.thumbnail_url}
                          alt={news.title}
                          className="w-24 h-24 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://cdnphoto.dantri.com.vn/V0A7pXa4T8wsbhHMmWmZti84Kkk=/2025/11/07/da-nang-1762483851451.jpg';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                          {news.title}
                        </h3>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {news.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>📅 {formatDate(news.published_at)}</span>
                          {news.lat && news.lon && (
                            <span>📍 {news.lat.toFixed(4)}, {news.lon.toFixed(4)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {news.source_url && (
                      <div className="px-3 pb-3">
                        <a
                          href={news.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                        >
                          🔗 Xem nguồn tin
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Không có tin tức cứu hộ</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
