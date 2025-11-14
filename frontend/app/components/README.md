# Components Structure - Feature-Based Organization

Cấu trúc thư mục components được tổ chức theo **feature-based architecture** - mỗi folder đại diện cho một chức năng chính của ứng dụng.

## 📁 Cấu trúc thư mục

```
components/
├── map/                    # 🗺️ Map Feature
│   ├── Map.tsx                    # Main map component với Mapbox
│   ├── MapControls.tsx            # Search & layer controls
│   ├── MapInfo.tsx                # Hiển thị tọa độ & zoom level
│   ├── ZoomControls.tsx           # Zoom in/out & location buttons
│   ├── WindLegend.tsx             # Wind speed legend
│   ├── LayerControls.tsx          # Layer toggle controls
│   └── index.ts                   # Exports
│
├── news/                   # 📰 News Feature
│   ├── NewsTab.tsx                # News list với categories
│   ├── NewsDetail.tsx             # Chi tiết tin tức
│   ├── newsData.ts                # News data & types
│   └── index.ts                   # Exports
│
├── warnings/               # ⚠️ Weather Warnings Feature
│   ├── WarningsTab.tsx            # Danh sách cảnh báo thời tiết
│   ├── warningsData.ts            # Warning data & types
│   ├── warningUtils.ts            # Utility functions (colors, etc.)
│   └── index.ts                   # Exports
│
├── chatbot/                # 💬 Chatbot Feature
│   ├── ChatbotTab.tsx             # Chat interface
│   ├── chatbotTypes.ts            # Message types
│   └── index.ts                   # Exports
│
├── sidebar/                # 🎨 Sidebar Layout
│   ├── Sidebar.tsx                # Main sidebar với tabs
│   └── index.ts                   # Exports
│
└── index.ts                       # Main barrel export
```

## 🎯 Feature-Based Architecture

### Lợi ích của cấu trúc này:

1. **🎯 Domain-Driven**: Mỗi folder = 1 feature hoàn chỉnh
2. **🔍 Dễ tìm kiếm**: Muốn sửa News? Vào folder `news/`
3. **📦 Encapsulation**: Logic, data, types đều ở cùng folder
4. **🔄 Reusability**: Dễ dàng copy toàn bộ feature sang project khác
5. **🚀 Scalability**: Thêm feature mới = thêm folder mới
6. **👥 Team-friendly**: Nhiều người làm các features khác nhau không conflict

## 📝 Cách sử dụng

### Import feature components:

```tsx
// Import từ feature folders
import { Map, MapControls, WindLegend } from "@/app/components/map";
import { NewsTab, NewsDetail, NewsItem } from "@/app/components/news";
import { WarningsTab, Warning } from "@/app/components/warnings";
import { ChatbotTab } from "@/app/components/chatbot";
import { Sidebar } from "@/app/components/sidebar";
```

### Import từ main index (recommended):

```tsx
// Import tất cả từ main components index
import {
  Map,
  NewsTab,
  WarningsTab,
  ChatbotTab,
  Sidebar,
} from "@/app/components";
```

## 📂 Chi tiết từng Feature

### 🗺️ **Map Feature**

Chứa toàn bộ logic liên quan đến bản đồ:

- Mapbox integration
- Controls (zoom, search, layers)
- Map UI elements (legend, info)
- Wind layer visualization

### 📰 **News Feature**

Quản lý tin tức thời tiết:

- Danh sách tin tức với categories
- Chi tiết bài viết
- Data management
- Click-to-map integration

### ⚠️ **Warnings Feature**

Hệ thống cảnh báo thời tiết:

- Danh sách warnings theo severity
- Filter by type & severity
- Expandable warning details
- Color-coded alerts (red/yellow/green)

### 💬 **Chatbot Feature**

AI assistant cho weather queries:

- Chat interface
- Message history
- Auto-scroll
- Real-time responses

### 🎨 **Sidebar Feature**

Layout component tổng hợp:

- Tab navigation (News/Warnings/Chatbot)
- Collapsible sidebar
- Settings footer

## 🔄 Workflow khi thêm feature mới

1. **Tạo folder mới**: `components/new-feature/`
2. **Tạo component chính**: `NewFeature.tsx`
3. **Tạo types/data**: `newFeatureTypes.ts`, `newFeatureData.ts`
4. **Tạo utils nếu cần**: `newFeatureUtils.ts`
5. **Export trong index.ts**:
   ```ts
   export { default as NewFeature } from "./NewFeature";
   export type { NewFeatureType } from "./newFeatureTypes";
   ```
6. **Thêm vào main index.ts**:
   ```ts
   export * from "./new-feature";
   ```

## 🏗️ Best Practices

### ✅ DO:

- Giữ tất cả files liên quan trong cùng feature folder
- Export types cùng với components
- Sử dụng barrel exports (index.ts)
- Đặt tên file rõ ràng (`newsData.ts`, `warningUtils.ts`)

### ❌ DON'T:

- Không tạo shared folder trừ khi thật sự cần
- Không import cross-feature trừ khi cần thiết
- Không duplicate code - tạo utils trong feature folder

## 🚀 Next Steps

- [ ] Thêm tests cho từng feature
- [ ] Tạo Storybook stories
- [ ] Document props cho từng component
- [ ] Thêm error boundaries
- [ ] Performance optimization
