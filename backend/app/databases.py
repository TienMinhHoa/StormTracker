from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ================================
# PostgreSQL connection URL
# ================================
# Format:
# postgresql://username:password@host:port/database_name
# Ví dụ local PostgreSQL:
# postgresql://postgres:123456@localhost:5432/geoai

SQLALCHEMY_DATABASE_URL = "postgresql://utequyen:utequyen@118.70.181.146:55432/utequyen"

# ================================
# SQLAlchemy Engine
# ================================
# connect_args không cần cho PostgreSQL
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,        # Tự kiểm tra kết nối
    pool_size=10,              # Tối ưu cho API
    max_overflow=20
)

# ================================
# Session Local
# ================================
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ================================
# Base class for models
# ================================
Base = declarative_base()


# ================================
# Dependency: get_db
# ================================
# FastAPI sẽ gọi hàm này trong mỗi request
# và tự đóng kết nối sau khi xử lý xong.
# ================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
