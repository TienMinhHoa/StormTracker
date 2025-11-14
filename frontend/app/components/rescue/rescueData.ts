export type RescueRequest = {
  id: number;
  name: string;
  phone: string;
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  numberOfPeople: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp: string;
  status: 'pending' | 'in-progress' | 'completed';
  category: 'medical' | 'trapped' | 'food-water' | 'evacuation' | 'other';
};

export const rescueRequests: RescueRequest[] = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    coordinates: [105.8342, 21.0278],
    address: '123 Đường ABC, Quận Ba Đình, Hà Nội',
    numberOfPeople: 5,
    urgency: 'critical',
    description: 'Nước ngập cao 1.5m, có người già và trẻ em cần sơ tán gấp',
    timestamp: '15 phút trước',
    status: 'pending',
    category: 'evacuation',
  },
  {
    id: 2,
    name: 'Trần Thị B',
    phone: '0912345678',
    coordinates: [106.6297, 10.8231],
    address: '456 Đường XYZ, Quận 1, TP.HCM',
    numberOfPeople: 3,
    urgency: 'high',
    description: 'Bị mắc kẹt trên tầng 2, cần thức ăn và nước uống',
    timestamp: '1 giờ trước',
    status: 'in-progress',
    category: 'food-water',
  },
  {
    id: 3,
    name: 'Lê Văn C',
    phone: '0923456789',
    coordinates: [108.2022, 16.0544],
    address: '789 Đường DEF, Quận Hải Châu, Đà Nẵng',
    numberOfPeople: 2,
    urgency: 'high',
    description: 'Có người bị thương cần hỗ trợ y tế khẩn cấp',
    timestamp: '30 phút trước',
    status: 'pending',
    category: 'medical',
  },
  {
    id: 4,
    name: 'Phạm Thị D',
    phone: '0934567890',
    coordinates: [107.5847, 16.4637],
    address: '321 Đường GHI, TP Huế',
    numberOfPeople: 7,
    urgency: 'medium',
    description: 'Nhà bị ngập, cần hỗ trợ di chuyển đến nơi an toàn',
    timestamp: '2 giờ trước',
    status: 'pending',
    category: 'evacuation',
  },
  {
    id: 5,
    name: 'Hoàng Văn E',
    phone: '0945678901',
    coordinates: [109.1967, 12.2388],
    address: '654 Đường JKL, TP Nha Trang',
    numberOfPeople: 4,
    urgency: 'medium',
    description: 'Bị cô lập do cây đổ, đường vào bị chặn',
    timestamp: '3 giờ trước',
    status: 'pending',
    category: 'trapped',
  },
];
