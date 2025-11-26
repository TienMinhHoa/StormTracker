'use client';

import { useState } from 'react';
import { createRescueRequest } from '../../services/rescueApi';

type RescueRequestFormProps = {
  onBack: () => void;
  stormId?: string;
};

export default function RescueRequestForm({ onBack, stormId }: RescueRequestFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    numberOfPeople: 1,
    urgency: 'high' as 'critical' | 'high' | 'medium' | 'low',
    category: 'evacuation' as 'medical' | 'trapped' | 'food-water' | 'evacuation' | 'other',
    description: '',
  });

  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setUseCurrentLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Không thể lấy vị trí hiện tại. Vui lòng cho phép truy cập vị trí.');
          setUseCurrentLocation(false);
        }
      );
    } else {
      alert('Trình duyệt không hỗ trợ định vị.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stormId) {
      alert('Vui lòng chọn cơn bão trước khi gửi yêu cầu cứu hộ.');
      return;
    }

    if (!coordinates && useCurrentLocation) {
      alert('Đang lấy vị trí của bạn...');
      return;
    }

    if (!coordinates) {
      alert('Vui lòng lấy vị trí hiện tại hoặc nhập tọa độ.');
      return;
    }

    // Map urgency to priority (1=highest, 5=lowest)
    const urgencyToPriority: Record<string, number> = {
      'critical': 1,
      'high': 2,
      'medium': 3,
      'low': 4,
    };

    setIsSubmitting(true);
    try {
      const requestData = {
        storm_id: stormId,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        lat: coordinates[1], // latitude
        lon: coordinates[0], // longitude
        priority: urgencyToPriority[formData.urgency] || 4,
        status: 'pending',
        type: 'emergency',
        people_detail: {
          numberOfPeople: formData.numberOfPeople,
          category: formData.category,
        },
        verified: true,
        note: formData.description || undefined,
      };

      console.log('📡 Sending rescue request:', requestData);
      const result = await createRescueRequest(requestData);
      console.log('✅ Rescue request created:', result);
      
      alert(`Yêu cầu cứu hộ đã được gửi thành công!\nMã yêu cầu: ${result.request_id}\nĐội cứu hộ sẽ liên hệ sớm nhất.`);
      onBack();
    } catch (error) {
      console.error('❌ Failed to create rescue request:', error);
      alert('Có lỗi xảy ra khi gửi yêu cầu cứu hộ. Vui lòng thử lại hoặc gọi đường dây nóng khẩn cấp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-white">Gửi yêu cầu cứu hộ</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#1c2127] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none"
              placeholder="Nguyễn Văn A"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-[#1c2127] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none"
              placeholder="0901234567"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Vị trí <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleGetLocation}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                useCurrentLocation
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {useCurrentLocation ? '✓ Đã lấy vị trí hiện tại' : 'Lấy vị trí hiện tại'}
            </button>
            {coordinates && (
              <p className="text-xs text-gray-400 mt-1">
                📍 {coordinates[1].toFixed(4)}°N, {coordinates[0].toFixed(4)}°E
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Địa chỉ chi tiết <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-[#1c2127] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none"
              placeholder="123 Đường ABC, Quận XYZ"
            />
          </div>

          {/* Number of People */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Số người cần cứu hộ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.numberOfPeople}
              onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-[#1c2127] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none"
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mức độ khẩn cấp <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
              className="w-full px-3 py-2 bg-[#1c2127] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none"
            >
              <option value="critical">🚨 Cực kỳ khẩn cấp</option>
              <option value="high">⚠️ Khẩn cấp</option>
              <option value="medium">⚡ Trung bình</option>
              <option value="low">✓ Không khẩn</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Loại cứu hộ <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 bg-[#1c2127] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none"
            >
              <option value="medical">🏥 Y tế khẩn cấp</option>
              <option value="trapped">🚧 Bị mắc kẹt</option>
              <option value="food-water">🍽️ Cần thức ăn/nước uống</option>
              <option value="evacuation">🚨 Cần sơ tán</option>
              <option value="other">❓ Khác</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mô tả tình huống <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#1c2127] border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none resize-none"
              placeholder="Mô tả chi tiết tình huống của bạn..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !stormId}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-sm"
          >
            {isSubmitting ? '⏳ Đang gửi...' : '🚨 GỬI YÊU CẦU CỨU HỘ'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Đội cứu hộ sẽ liên hệ với bạn sớm nhất có thể
          </p>
        </form>
      </div>
    </div>
  );
}
