# Mock Data Documentation

File này chứa data mẫu cho dự án Windy Clone, được tạo từ schema database để hỗ trợ phát triển frontend trước khi có API thực tế.

## Cấu trúc Database

### 6 bảng chính:
1. **storms**: Thông tin cơn bão cơ bản
2. **storm_tracks**: Đường đi của bão theo thời gian
3. **news_sources**: Tin tức từ các nguồn
4. **social_posts**: Bài đăng mạng xã hội
5. **rescue_requests**: Yêu cầu cứu hộ
6. **damage_assessment**: Đánh giá thiệt hại

## Cách sử dụng

### Import và sử dụng data trực tiếp

```typescript
import { mockStorms, mockStormTracks } from '@/app/data/mockData';

// Lấy tất cả cơn bão
const storms = mockStorms;

// Lấy đường đi của bão có ID = 1
const tracks = mockStormTracks.filter(track => track.storm_id === 1);
```

### Sử dụng helper functions

```typescript
import {
  getStormData,
  getActiveStorms,
  getRescuePoints,
  getDamagePoints
} from '@/app/data/mockDataHelpers';

// Lấy toàn bộ data của một cơn bão
const stormData = getStormData(1); // { storm, tracks, newsSources, ... }

// Lấy các cơn bão đang hoạt động
const activeStorms = getActiveStorms();

// Lấy các điểm cần cứu hộ đã xác thực
const rescuePoints = getRescuePoints();

// Lấy các điểm thiệt hại
const damagePoints = getDamagePoints();
```

## Helper Functions

### Lấy data theo storm_id
- `getStormById(stormId)`: Lấy thông tin cơn bão
- `getStormTracks(stormId)`: Lấy đường đi của bão
- `getNewsSources(stormId)`: Lấy tin tức liên quan
- `getSocialPosts(stormId)`: Lấy bài đăng mạng xã hội
- `getRescueRequests(stormId)`: Lấy yêu cầu cứu hộ
- `getDamageAssessments(stormId)`: Lấy đánh giá thiệt hại

### Lấy data tổng hợp
- `getStormData(stormId)`: Lấy tất cả data liên quan đến một cơn bão
- `getStormStatistics(stormId)`: Lấy thống kê tổng hợp của cơn bão
- `getStormsWithLatestPosition()`: Lấy tất cả bão với vị trí mới nhất

### Lọc data
- `getActiveStorms()`: Lấy bão đang hoạt động
- `getRecentStorms()`: Lấy bão trong 30 ngày qua
- `getVerifiedRescueRequests()`: Lấy yêu cầu cứu hộ đã xác thực
- `getValidSocialPosts()`: Lấy bài đăng hợp lệ

### Points cho map
- `getRescuePoints()`: Lấy các điểm cần cứu hộ cho bản đồ
- `getDamagePoints()`: Lấy các điểm thiệt hại cho bản đồ

## Data Mẫu

### Cơn bão mẫu:
- **Bão số 1 - Yagi**: Hoạt động từ 06/09 - 09/09/2024, ảnh hưởng Bắc Bộ
- **Bão số 2 - Zonda**: Hoạt động từ 15/09 - 18/09/2024, ảnh hưởng Trung Bộ
- **Bão số 3 - Ampil**: Đang hoạt động từ 20/10/2024, trên biển Đông

### Các loại dữ liệu:
- **Storm tracks**: Đường đi với category (1-5) và wind_speed (km/h)
- **News sources**: Tin tức với thông tin thiệt hại
- **Social posts**: Bài đăng Facebook, Twitter, Instagram với vị trí
- **Rescue requests**: Yêu cầu cứu hộ với mức độ nghiêm trọng (1-5)
- **Damage assessments**: Thống kê thiệt hại tổng hợp

## Lưu ý

1. Tất cả coordinates (lat, lon) đều là giá trị thực tế của Việt Nam
2. Thời gian sử dụng format ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
3. Damage estimate tính bằng VND
4. Severity levels: 1 (thấp) - 5 (rất cao)
5. Storm categories: 1 (nhiệt đới) - 5 (siêu bão)

## Chuyển sang API thực tế

Khi API backend sẵn sàng, chỉ cần thay thế các import từ `mockData` thành API calls:

```typescript
// Thay vì
import { getStormData } from '@/app/data/mockDataHelpers';

// Sẽ thành
import { getStormData } from '@/app/api/stormApi';
```

Data structure sẽ giữ nguyên nên việc chuyển đổi rất dễ dàng.
