export interface Storm {
  storm_id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  description: string;
}

export interface StormTrack {
  track_id: number;
  storm_id: number;
  timestamp: string;
  lat: number;
  lon: number;
  category: number;
  wind_speed: number;
}

export interface NewsSource {
  news_id: number;
  storm_id: number;
  title: string;
  content: string;
  source_url: string;
  published_at: string;
  lat: number;
  lon: number;
  fatalities: number | null;
  injured: number | null;
  damage_estimate: number | null;
}

export interface SocialPost {
  post_id: number;
  storm_id: number;
  content: string;
  platform: string;
  author: string;
  posted_at: string;
  lat: number;
  lon: number;
  phone: string | null;
  is_valid: boolean;
  source: 'user' | 'crawler';
}

export interface RescueRequest {
  request_id: number;
  storm_id: number;
  social_post_id: number;
  phone: string;
  lat: number;
  lon: number;
  severity: number;
  verified: boolean;
  created_at: string;
}

export interface DamageAssessment {
  id: number;
  storm_id: number;
  total_fatalities: number;
  total_injured: number;
  total_facilities: number;
  updated_at: string;
  news_id: number;
  lat: number;
  lon: number;
  time: string;
}

export const mockStorms: Storm[] = [
  {
    storm_id: 1,
    name: "Bão số 1 - Yagi",
    start_date: "2024-09-06",
    end_date: "2024-09-09",
    description: "Bão Yagi là cơn bão nhiệt đới mạnh ảnh hưởng đến khu vực Bắc Bộ Việt Nam, gây mưa lớn và gió mạnh."
  },
  {
    storm_id: 2,
    name: "Bão số 2 - Zonda",
    start_date: "2024-09-15",
    end_date: "2024-09-18",
    description: "Bão Zonda gây thiệt hại nghiêm trọng cho các tỉnh miền Trung, với gió cấp 13-14."
  },
  {
    storm_id: 3,
    name: "Bão số 3 - Ampil",
    start_date: "2024-10-20",
    end_date: null,
    description: "Bão Ampil đang hoạt động trên biển Đông, dự kiến ảnh hưởng đến Philippines và Việt Nam."
  }
];

export const mockStormTracks: StormTrack[] = [
  // Bão Yagi - di chuyển từ Đông Bắc xuống Tây Nam
  {
    track_id: 1,
    storm_id: 1,
    timestamp: "2024-09-06T06:00:00Z",
    lat: 18.5,
    lon: 118.2,
    category: 1,
    wind_speed: 65
  },
  {
    track_id: 2,
    storm_id: 1,
    timestamp: "2024-09-07T06:00:00Z",
    lat: 19.8,
    lon: 113.8,
    category: 2,
    wind_speed: 85
  },
  {
    track_id: 3,
    storm_id: 1,
    timestamp: "2024-09-08T06:00:00Z",
    lat: 21.2,
    lon: 109.5,
    category: 3,
    wind_speed: 105
  },
  {
    track_id: 4,
    storm_id: 1,
    timestamp: "2024-09-09T06:00:00Z",
    lat: 22.8,
    lon: 105.2,
    category: 2,
    wind_speed: 95
  },

  // Bão Zonda - di chuyển dọc bờ biển Trung Bộ
  {
    track_id: 5,
    storm_id: 2,
    timestamp: "2024-09-15T06:00:00Z",
    lat: 12.5,
    lon: 115.8,
    category: 1,
    wind_speed: 55
  },
  {
    track_id: 6,
    storm_id: 2,
    timestamp: "2024-09-16T06:00:00Z",
    lat: 13.8,
    lon: 112.2,
    category: 2,
    wind_speed: 75
  },
  {
    track_id: 7,
    storm_id: 2,
    timestamp: "2024-09-17T06:00:00Z",
    lat: 15.2,
    lon: 108.9,
    category: 3,
    wind_speed: 115
  },
  {
    track_id: 8,
    storm_id: 2,
    timestamp: "2024-09-18T06:00:00Z",
    lat: 16.5,
    lon: 105.8,
    category: 2,
    wind_speed: 85
  },

  // Bão Ampil - đang hoạt động
  {
    track_id: 9,
    storm_id: 3,
    timestamp: "2024-10-20T06:00:00Z",
    lat: 14.2,
    lon: 120.5,
    category: 1,
    wind_speed: 45
  },
  {
    track_id: 10,
    storm_id: 3,
    timestamp: "2024-10-21T06:00:00Z",
    lat: 13.8,
    lon: 118.9,
    category: 2,
    wind_speed: 65
  }
];

export const mockNewsSources: NewsSource[] = [
  {
    news_id: 1,
    storm_id: 1,
    title: "Bão Yagi gây mưa lớn ở Hà Nội, nhiều khu vực ngập úng",
    content: "Cơn bão Yagi đã gây mưa lớn kéo dài ở Hà Nội và các tỉnh phía Bắc. Nhiều tuyến phố bị ngập úng, giao thông bị ảnh hưởng nghiêm trọng.",
    source_url: "https://vnexpress.net/bao-yagi-gay-mua-lon-o-ha-noi-4851234",
    published_at: "2024-09-08T14:30:00Z",
    lat: 21.0285,
    lon: 105.8542,
    fatalities: 2,
    injured: 15,
    damage_estimate: 5000000000
  },
  {
    news_id: 2,
    storm_id: 1,
    title: "Thiệt hại do bão Yagi: 3 người chết, hàng trăm nhà bị tốc mái",
    content: "Theo báo cáo sơ bộ, bão Yagi đã gây thiệt hại nặng nề cho các tỉnh Quảng Ninh, Hải Phòng với 3 người chết và hàng trăm căn nhà bị tốc mái.",
    source_url: "https://tuoitre.vn/thiet-hai-bao-yagi-3-nguoi-chet-4851456",
    published_at: "2024-09-09T09:15:00Z",
    lat: 20.8449,
    lon: 106.6881,
    fatalities: 3,
    injured: 8,
    damage_estimate: 8000000000
  },
  {
    news_id: 3,
    storm_id: 2,
    title: "Bão Zonda tàn phá Đà Nẵng, nhiều cây đổ chắn đường",
    content: "Bão Zonda với sức gió lên đến 135km/h đã gây thiệt hại nặng nề cho thành phố Đà Nẵng. Hàng trăm cây xanh bị đổ, nhiều tuyến đường bị tắc nghẽn.",
    source_url: "https://dantri.com.vn/bao-zonda-tan-pha-da-nang-4852345",
    published_at: "2024-09-17T16:45:00Z",
    lat: 16.0544,
    lon: 108.2022,
    fatalities: 1,
    injured: 25,
    damage_estimate: 12000000000
  }
];

export const mockSocialPosts: SocialPost[] = [
  {
    post_id: 1,
    storm_id: 1,
    content: "Nhà mình ở Hải Phòng bị tốc mái rồi mọi người ơi! Cần giúp đỡ gấp!!! #BaoYagi #CuuHo",
    platform: "facebook",
    author: "Nguyen Van A",
    posted_at: "2024-09-08T20:15:00Z",
    lat: 20.8449,
    lon: 106.6881,
    phone: "0987654321",
    is_valid: true,
    source: "user"
  },
  {
    post_id: 2,
    storm_id: 1,
    content: "Ở đây mưa quá to, nước ngập đến tận cửa nhà. Ai có thuyền máy không giúp em với!",
    platform: "twitter",
    author: "Tran Thi B",
    posted_at: "2024-09-08T22:30:00Z",
    lat: 21.0285,
    lon: 105.8542,
    phone: "0978123456",
    is_valid: true,
    source: "crawler"
  },
  {
    post_id: 3,
    storm_id: 2,
    content: "Bão Zonda thổi mạnh quá, nhà cửa rung cả lên. Ở Hội An cần hỗ trợ khẩn cấp!",
    platform: "instagram",
    author: "Le Van C",
    posted_at: "2024-09-17T18:45:00Z",
    lat: 15.8794,
    lon: 108.3350,
    phone: "0967345678",
    is_valid: true,
    source: "user"
  },
  {
    post_id: 4,
    storm_id: 2,
    content: "Đà Nẵng sau bão, cảnh tượng tang thương. Cần lương khô và thuốc men gấp!",
    platform: "facebook",
    author: "Pham Thi D",
    posted_at: "2024-09-18T08:20:00Z",
    lat: 16.0544,
    lon: 108.2022,
    phone: null,
    is_valid: false,
    source: "crawler"
  }
];

export const mockRescueRequests: RescueRequest[] = [
  {
    request_id: 1,
    storm_id: 1,
    social_post_id: 1,
    phone: "0987654321",
    lat: 20.8449,
    lon: 106.6881,
    severity: 3,
    verified: true,
    created_at: "2024-09-08T20:20:00Z"
  },
  {
    request_id: 2,
    storm_id: 1,
    social_post_id: 2,
    phone: "0978123456",
    lat: 21.0285,
    lon: 105.8542,
    severity: 2,
    verified: true,
    created_at: "2024-09-08T22:35:00Z"
  },
  {
    request_id: 3,
    storm_id: 2,
    social_post_id: 3,
    phone: "0967345678",
    lat: 15.8794,
    lon: 108.3350,
    severity: 4,
    verified: true,
    created_at: "2024-09-17T18:50:00Z"
  }
];

export const mockDamageAssessments: DamageAssessment[] = [
  {
    id: 1,
    storm_id: 1,
    total_fatalities: 5,
    total_injured: 23,
    total_facilities: 45,
    updated_at: "2024-09-09T12:00:00Z",
    news_id: 1,
    lat: 21.0285,
    lon: 105.8542,
    time: "2024-09-09T12:00:00Z"
  },
  {
    id: 2,
    storm_id: 1,
    total_fatalities: 8,
    total_injured: 31,
    total_facilities: 67,
    updated_at: "2024-09-10T10:30:00Z",
    news_id: 2,
    lat: 20.8449,
    lon: 106.6881,
    time: "2024-09-10T10:30:00Z"
  },
  {
    id: 3,
    storm_id: 2,
    total_fatalities: 12,
    total_injured: 45,
    total_facilities: 89,
    updated_at: "2024-09-18T14:15:00Z",
    news_id: 3,
    lat: 16.0544,
    lon: 108.2022,
    time: "2024-09-18T14:15:00Z"
  }
];
