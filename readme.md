# 🌪️ Storm Tracker

Hệ thống theo dõi và cảnh báo bão thông minh với AI Chatbot hỗ trợ cứu hộ.

## 🚀 Quick Start

**Muốn chạy ngay?** → Xem [QUICK_START.md](./QUICK_START.md)
**Chatbot Setup** → Xem [CHATBOT_IMPLEMENTATION.md](./CHATBOT_IMPLEMENTATION.md)

## ✨ Tính năng

### 🗺️ Frontend (Next.js)

- Bản đồ tương tác với Mapbox GL JS
- Giao diện tối màu giống Windy.com
- Hiển thị layer gió từ TIFF data (GFS model)
- Controls: Opacity, Forecast Hour, Wind Animation
- Feature-Based Architecture với TypeScript
- Next.js 16 với App Router

### 🤖 AI Chatbot (NEW!)

- **RAG với Qdrant**: Trả lời câu hỏi về bão, phòng tránh, sơ cứu
- **Rescue Request**: Tạo yêu cầu cứu hộ tự động
- **LangGraph Agent**: Sử dụng Google Gemini 2.0 Flash
- **Knowledge Base**: 13 chủ đề kiến thức về bão
- **Action-capable**: Có thể thực hiện hành động (push rescue request)

### 🔧 Backend (FastAPI)

- RESTful API cho storms, news, damage, rescue requests
- PostgreSQL database với SQLAlchemy
- Async/await support
- Alembic migrations
- Health monitoring

## Cài đặt

### 1. Clone và cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `frontend/.env.local` với nội dung:

```bash
# Mapbox Access Token (bắt buộc)
# Lấy token tại: https://account.mapbox.com/access-tokens/
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# GeoServer Configuration (tùy chọn)
NEXT_PUBLIC_GEOSERVER_URL=http://localhost:8080/geoserver/wms
NEXT_PUBLIC_GEOSERVER_WORKSPACE=your_workspace
NEXT_PUBLIC_GEOSERVER_WIND_LAYER=wind_data
```

### 3. Chạy development server

```bash
cd frontend
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong browser.

## Dữ liệu gió

Project đã bao gồm file TIFF mẫu:

- `frontend/public/U_20251115_100.tif` - Component gió U (đông-tây)
- `frontend/public/V_20251115_100.tif` - Component gió V (nam-bắc)

### GeoServer (Tùy chọn)

Nếu muốn sử dụng GeoServer thay vì TIFF files trực tiếp:
Xem hướng dẫn chi tiết trong file [GEOSERVER_SETUP.md](./GEOSERVER_SETUP.md).

### Tóm tắt setup GeoServer:

1. Cài đặt GeoServer
2. Upload file TIFF chứa dữ liệu gió
3. Publish layer trong GeoServer
4. Cập nhật URL và tên layer trong `frontend/.env.local`

## 📁 Cấu trúc dự án

```
StormTracker/
├── frontend/                    # Next.js Frontend
│   ├── app/
│   │   ├── components/          # Feature-based Components
│   │   │   ├── map/             # Map Feature
│   │   │   ├── chatbot/         # Chatbot UI (NEW!)
│   │   │   ├── news/            # News Feature
│   │   │   ├── rescue/          # Rescue Feature
│   │   │   └── ...
│   │   └── api/                 # API Routes
│   └── public/                  # Static assets
│
├── backend/                     # FastAPI Backend
│   ├── src/
│   │   ├── chatbot/             # 🤖 AI Chatbot Module (NEW!)
│   │   │   ├── agent.py         # LangGraph agent
│   │   │   ├── tools.py         # RAG + Rescue tools
│   │   │   ├── service.py       # Business logic
│   │   │   ├── router.py        # API endpoints
│   │   │   ├── seed_knowledge.py # Knowledge base setup
│   │   │   └── README.md        # Chatbot docs
│   │   ├── storms/              # Storms API
│   │   ├── news/                # News API
│   │   ├── damage/              # Damage assessment API
│   │   ├── rescue/              # Rescue requests API
│   │   └── main.py              # FastAPI app
│   ├── alembic/                 # Database migrations
│   └── pyproject.toml           # Python dependencies
│
├── CHATBOT_IMPLEMENTATION.md    # Chatbot overview (NEW!)
├── INSTALLATION_GUIDE.md        # Setup instructions (NEW!)
└── README.md                    # This file
```

## 🛠️ Công nghệ sử dụng

### Frontend

- **Next.js 16** - React framework
- **Mapbox GL JS** - Interactive maps
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Backend

- **FastAPI** - Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations

### AI Chatbot

- **Google Gemini 2.0 Flash** - Large Language Model
- **LangChain 0.3.27** - LLM framework
- **LangGraph 0.2.59+** - Agent workflow
- **Qdrant** - Vector database
- **Google Embeddings** - Text embeddings

### Infrastructure

- **GeoServer** - Geospatial data server
- **Docker** - Containerization

## 🤖 Chatbot Features

### RAG (Retrieval Augmented Generation)

- Semantic search trong knowledge base với Qdrant
- 13 chủ đề: chuẩn bị bão, sơ cứu, CPR, phòng bệnh, sơ tán...
- Google Embeddings (768D) + COSINE similarity

### Rescue Request Tool

- Tự động tạo yêu cầu cứu hộ từ conversation
- Lưu vào database với full validation
- Transaction-safe với async support

### LangGraph Agent

- Google Gemini 2.0 Flash LLM
- StateGraph workflow với conditional edges
- Multi-turn conversation support
- Intelligent tool routing

### API Endpoints

- `POST /chatbot/chat` - Chat với AI
- `GET /chatbot/health` - Health check
- `POST /chatbot/reset` - Reset conversation

## 📚 Documentation

### Chatbot

- [CHATBOT_IMPLEMENTATION.md](./CHATBOT_IMPLEMENTATION.md) - Tổng quan
- [backend/INSTALLATION_GUIDE.md](./backend/INSTALLATION_GUIDE.md) - Hướng dẫn cài đặt
- [backend/src/chatbot/README.md](./backend/src/chatbot/README.md) - Chi tiết kỹ thuật
- [backend/src/chatbot/QUICKSTART.md](./backend/src/chatbot/QUICKSTART.md) - Quick start
- [backend/src/chatbot/TECHNICAL_OVERVIEW.md](./backend/src/chatbot/TECHNICAL_OVERVIEW.md) - Architecture

### Frontend

- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [frontend/QUICK_START.md](./frontend/QUICK_START.md) - Frontend setup

## 🚀 Deployment

### Development

```bash
# Backend
cd backend
uvicorn src.main:app --reload

# Frontend
cd frontend
npm run dev
```

### Production

```bash
# Backend
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend
npm run build
npm start
```

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: See files above
- **Email**: support@stormtracker.com

## 📝 License

MIT License - See LICENSE file for details

---

**Last Updated:** November 25, 2025
**Version:** 1.0.0 (with AI Chatbot)
