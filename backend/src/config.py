import os
from pydantic_settings import BaseSettings
from src.constants import LogLevel, Environment
class Config(BaseSettings):
    DATABASE_URL: str
    APP_NAME: str = "FastAPI Application"
    LOG_DIR: str = "./logs"
    APP_ENV: Environment = Environment.DEVELOPMENT
    LOG_LEVEL: LogLevel = LogLevel.INFO
    APP_VERSION: str = "1.0.0"
    GOOGLE_API_KEY: str
    SERPAPI_API_KEY: str
    class Config:
        env_file = os.getenv("ENV_FILE", ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

config = Config()