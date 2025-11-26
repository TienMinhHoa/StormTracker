'use client';

import { useState, useEffect } from 'react';
import { RescueRequest as MockRescueRequest, getRescueRequests } from '../../data';
import { getRescueNewsByStorm, type News } from '../../services/newsApi';

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
  status: 'pending' | 'in-progress' | 'completed';
  timestamp: string;
}

// Convert MockRescueRequest to RescueRequest format
const convertMockToRescueRequest = (mockRequest: MockRescueRequest): RescueRequest => {
  const urgency = mapSeverityToUrgency(mockRequest.severity);
  const categories = ['medical', 'trapped', 'food-water', 'evacuation', 'other'];
  const category = categories[Math.floor(Math.random() * categories.length)]; // Random category for demo

  return {
    id: mockRequest.request_id,
    name: `Yêu cầu cứu hộ #${mockRequest.request_id}`,
    phone: mockRequest.phone,
    coordinates: [mockRequest.lon, mockRequest.lat],
    address: `Vị trí ${mockRequest.lat.toFixed(4)}°N, ${mockRequest.lon.toFixed(4)}°E`,
    category,
    urgency,
    numberOfPeople: Math.floor(Math.random() * 10) + 1, // Random number for demo
    description: `Yêu cầu cứu hộ khẩn cấp tại khu vực bị ảnh hưởng bởi bão. Mức độ nghiêm trọng: ${mockRequest.severity}/5.`,
    status: mockRequest.verified ? 'pending' : 'in-progress',
    timestamp: new Date(mockRequest.created_at).toLocaleString('vi-VN')
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
  pending: 'Chờ cứu hộ',
  'in-progress': 'Đang cứu hộ',
  completed: 'Đã hoàn thành',
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

  // Get rescue requests from mock data helpers (simulating API call)
  const mockRescueRequests = stormId ? getRescueRequests(stormId) : [];
  const rescueRequests = mockRescueRequests.map(convertMockToRescueRequest);

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
              <div className="bg-[#1c2127] rounded-lg p-3">
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
              </div>
            )}

            {/* Rescue Requests List */}
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
                        {request.urgency.toUpperCase()}
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
                      <button className="flex-1 text-xs px-3 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#137fec]/90 transition-colors font-medium">
                        📍 Xem trên bản đồ
                      </button>
                      <button className="flex-1 text-xs px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                        ✓ Đánh dấu đã cứu
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

            {rescueRequests.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Không có yêu cầu cứu hộ nào</p>
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
