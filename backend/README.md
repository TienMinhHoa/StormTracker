# 🌪️ StormTracker Backend

Backend API cho hệ thống theo dõi và quản lý bão với AI Chatbot hỗ trợ cứu hộ.

## 📋 Tổng quan

StormTracker Backend cung cấp:

- 🌀 **Storm Tracking**: Theo dõi thông tin về bão
- 📰 **News Integration**: Tích hợp tin tức về bão từ nhiều nguồn
- 🏚️ **Damage Assessment**: Đánh giá thiệt hại do bão
- 🆘 **Rescue Requests**: Quản lý yêu cầu cứu hộ
- ⚠️ **Warnings**: Cảnh báo thời tiết
- 🤖 **AI Chatbot**: Trợ lý AI với RAG và WebSocket support

## 🚀 Quick Start

### 1. Cài đặt Dependencies

```bash
# Tạo virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Cài đặt packages
pip install -e .
```

### 2. Setup Database

```bash
# Chạy migrations
alembic upgrade head
```

### 3. Setup Qdrant (cho Chatbot)

```bash
# Option 1: Sử dụng Qdrant Cloud (đã config trong .env)
# Không cần làm gì thêm

# Option 2: Local Qdrant với Docker
docker run -p 6333:6333 qdrant/qdrant
```

### 4. Seed Knowledge Base (cho Chatbot)

```bash
python src/chatbot/seed_knowledge.py
```

### 5. Start Server

```bash
uvicorn src.main:app --reload
```

Server sẽ chạy tại: http://localhost:8000

## 📡 API Endpoints

### Core Services

- **Storms**: `/storms` - Quản lý thông tin bão
- **News**: `/news` - Tin tức về bão
- **Damage**: `/damage` - Đánh giá thiệt hại
- **Rescue**: `/rescue` - Yêu cầu cứu hộ
- **Warnings**: `/warnings` - Cảnh báo thời tiết

### AI Chatbot

#### HTTP Endpoints

- `POST /chatbot/chat` - Chat với AI assistant
- `GET /chatbot/health` - Kiểm tra health status
- `POST /chatbot/reset` - Reset conversation
- `GET /chatbot/ws/connections` - Xem active WebSocket connections

#### WebSocket Endpoint

- `ws://localhost:8000/chatbot/ws` - Real-time chat

### Health Check

- `GET /health` - Overall service health

## 🤖 AI Chatbot Features

### Capabilities

1. **RAG (Retrieval Augmented Generation)**

   - Tìm kiếm thông tin từ knowledge base
   - 13 chủ đề về phòng tránh bão, sơ cứu, cứu hộ
   - Powered by Qdrant vector database

2. **Rescue Request Creation**

   - Tự động tạo yêu cầu cứu hộ từ cuộc trò chuyện
   - Lưu vào database
   - Tích hợp với rescue service

3. **Real-time Chat**
   - HTTP REST API cho simple requests
   - WebSocket cho real-time communication
   - Maintain conversation history

### Usage Examples

#### HTTP API

```python
import requests

response = requests.post("http://localhost:8000/chatbot/chat", json={
    "message": "Cách chuẩn bị khi có bão?",
    "storm_id": "STORM001",
    "conversation_history": []
})

print(response.json()["response"])
```

#### WebSocket

```python
import asyncio
import websockets
import json

async def chat():
    uri = "ws://localhost:8000/chatbot/ws"
    async with websockets.connect(uri) as ws:
        # Send message
        await ws.send(json.dumps({
            "type": "message",
            "message": "Cách chuẩn bị khi có bão?",
            "storm_id": "STORM001"
        }))

        # Receive response
        response = await ws.recv()
        print(json.loads(response))

asyncio.run(chat())
```

## 🧪 Testing

### Test WebSocket Integration

```bash
python test_websocket_integration.py
```

### Interactive Chat Demo

```bash
# HTTP Demo
python src/chatbot/demo.py

# WebSocket Demo
python src/chatbot/demo_websocket.py
```

### Browser WebSocket Test

```bash
# Serve HTML demo
cd src/chatbot
python -m http.server 8080

# Open in browser: http://localhost:8080/websocket_demo.html
```

## 📁 Project Structure

```
backend/
├── alembic/                    # Database migrations
├── logs/                       # Application logs
├── src/
│   ├── main.py                # FastAPI application entry
│   ├── config.py              # Configuration management
│   ├── database.py            # Database connection
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic schemas
│   │
│   ├── chatbot/               # 🤖 AI Chatbot module
│   │   ├── agent.py          # LangGraph agent
│   │   ├── tools.py          # RAG + Rescue tools
│   │   ├── service.py        # Business logic
│   │   ├── router.py         # HTTP + WebSocket endpoints
│   │   ├── schemas.py        # Request/Response models
│   │   ├── seed_knowledge.py # Knowledge base seeding
│   │   ├── demo.py           # HTTP demo
│   │   ├── demo_websocket.py # WebSocket demo
│   │   └── websocket_demo.html # Browser WebSocket UI
│   │
│   ├── storms/                # Storm tracking
│   ├── news/                  # News integration
│   ├── damage/                # Damage assessment
│   ├── rescue/                # Rescue requests
│   └── warnings/              # Weather warnings
│
├── test_websocket_integration.py  # Quick integration test
├── pyproject.toml             # Dependencies
└── .env                       # Environment variables
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# App Configuration
APP_NAME=STORMDB
LOG_LEVEL=DEBUG

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db

# Google AI
GOOGLE_API_KEY=your_api_key_here

# Qdrant Vector Database
QDRANT_URL=https://your-qdrant-cluster.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
```

## 🛠️ Technologies

### Core

- **FastAPI**: Web framework
- **SQLAlchemy**: ORM
- **PostgreSQL**: Database
- **Alembic**: Database migrations

### AI & ML

- **LangChain 0.3.27**: LLM framework
- **LangGraph 0.2.59+**: Agent orchestration
- **Google Gemini 2.0**: LLM
- **Qdrant 1.12.1+**: Vector database
- **Google Embeddings**: Text embeddings

### Real-time

- **WebSockets 13.1**: Real-time communication
- **asyncio**: Async programming

## 📚 Documentation

Xem thêm tài liệu chi tiết trong thư mục `src/chatbot/`:

- `README.md` - Tổng quan về Chatbot
- `QUICKSTART.md` - Hướng dẫn nhanh
- `TECHNICAL_OVERVIEW.md` - Chi tiết kỹ thuật
- `WEBSOCKET_GUIDE.md` - Hướng dẫn WebSocket
- `INSTALLATION_GUIDE.md` - Hướng dẫn cài đặt
- `CHATBOT_SUMMARY.md` - Tóm tắt implementation

## 🔐 Security Notes

- API keys được lưu trong `.env` (không commit)
- Database credentials được mã hóa
- WebSocket authentication (TODO)
- Rate limiting (TODO)

## 🐛 Troubleshooting

### Chatbot không hoạt động

1. **Check Qdrant connection**

   ```bash
   curl http://localhost:8000/chatbot/health
   ```

2. **Verify knowledge base**

   ```bash
   python src/chatbot/seed_knowledge.py
   ```

3. **Check logs**
   ```bash
   tail -f logs/app.log
   ```

### WebSocket connection failed

1. **Check server is running**

   ```bash
   curl http://localhost:8000/health
   ```

2. **Test with integration script**

   ```bash
   python test_websocket_integration.py
   ```

3. **Check active connections**
   ```bash
   curl http://localhost:8000/chatbot/ws/connections
   ```

## 🚀 Deployment

### Production Checklist

- [ ] Set `LOG_LEVEL=INFO` in production
- [ ] Use production Qdrant cluster
- [ ] Configure proper CORS
- [ ] Add WebSocket authentication
- [ ] Enable rate limiting
- [ ] Setup monitoring & alerts
- [ ] Configure SSL/TLS
- [ ] Database connection pooling
- [ ] Load balancer for WebSocket

## 📄 API Documentation

Khi server đang chạy, truy cập:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 👥 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📝 License

[Your License Here]

## 🤝 Support

For issues or questions:

- Check documentation in `src/chatbot/`
- Review logs in `logs/`
- Test with demo scripts

---

**Status**: ✅ Production Ready with WebSocket Support
**Last Updated**: November 25, 2025
**Version**: 0.1.0
