'use client';

import { useState } from 'react';
import { RescueRequest as MockRescueRequest, getRescueRequests } from '../../data';

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
  stormId?: string | number;
  showRescueMarkers?: boolean;
  onShowRescueMarkersChange?: (show: boolean) => void;
};

export default function RescueTab({ onRescueClick, stormId, showRescueMarkers = true, onShowRescueMarkersChange }: RescueTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Get rescue requests from mock data helpers (simulating API call)
  const mockRescueRequests = stormId ? getRescueRequests(stormId) : [];
  const rescueRequests = mockRescueRequests.map(convertMockToRescueRequest);

  const filteredRequests = selectedUrgency === 'all'
    ? rescueRequests
    : rescueRequests.filter(req => req.urgency === selectedUrgency);

  const handleRequestClick = (request: RescueRequest) => {
    setExpandedId(expandedId === request.id ? null : request.id);
    onRescueClick?.(request);
  };

  if (showForm) {
    return <RescueRequestForm onBack={() => setShowForm(false)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 space-y-4">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Yêu cầu cứu hộ</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Cầu cứu
          </button>
        </div>

        {/* Filter by Urgency */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          <button
            onClick={() => setSelectedUrgency('all')}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selectedUrgency === 'all'
                ? 'bg-[#137fec] text-white'
                : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Tất cả ({rescueRequests.length})
          </button>
          <button
            onClick={() => setSelectedUrgency('critical')}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selectedUrgency === 'critical'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🚨 Khẩn cấp
          </button>
          <button
            onClick={() => setSelectedUrgency('high')}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selectedUrgency === 'high'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
            }`}
          >
            ⚠️ Cao
          </button>
          <button
            onClick={() => setSelectedUrgency('medium')}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selectedUrgency === 'medium'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'
            }`}
          >
            ⚡ Trung bình
          </button>
        </div>

        {/* Marker Toggle - Between filter and content */}
        {onShowRescueMarkersChange && (
          <div className="flex items-center justify-end -mx-4 px-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Hiển thị marker</span>
              <button
                onClick={() => onShowRescueMarkersChange(!showRescueMarkers)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showRescueMarkers ? 'bg-[#137fec]' : 'bg-gray-600'
                }`}
                title={showRescueMarkers ? 'Ẩn marker' : 'Hiện marker'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showRescueMarkers ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Rescue Requests List */}
        <div className="flex flex-col gap-3">
          {filteredRequests.map((request) => {
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

        {filteredRequests.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Không có yêu cầu cứu hộ nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
