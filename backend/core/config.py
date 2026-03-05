from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "LogHist API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = ["https://yourdomain.ru", "http://localhost:5173"]

    # MongoDB
    MONGO_HOST: str = "localhost"
    MONGO_PORT: int = 27017
    MONGO_APP_USER: str = ""
    MONGO_APP_PASSWORD: str = ""
    MONGO_DB: str = "loghist"

    @property
    def MONGO_URI(self) -> str:
        if self.MONGO_APP_USER and self.MONGO_APP_PASSWORD:
            return (
                f"mongodb://{self.MONGO_APP_USER}:{self.MONGO_APP_PASSWORD}"
                f"@{self.MONGO_HOST}:{self.MONGO_PORT}/{self.MONGO_DB}?authSource={self.MONGO_DB}"
            )
        return f"mongodb://{self.MONGO_HOST}:{self.MONGO_PORT}"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = "changeme"
    REDIS_DB: int = 0

    # JWT
    JWT_SECRET_KEY: str = "REPLACE_WITH_STRONG_SECRET_AT_LEAST_64_CHARS"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # OpenAI (ChatGPT)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_VISION_MODEL: str = "gpt-4o"

    # Telegram Bot
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_WEBHOOK_HOST: str = ""  # e.g. https://yourdomain.ru
    TELEGRAM_WEBHOOK_PATH: str = "/webhook/telegram"
    TELEGRAM_WEBHOOK_SECRET: str = "REPLACE_WITH_STRONG_SECRET"

    # Encryption — AES-256 key (32 bytes, base64-encoded)
    ENCRYPTION_KEY: str = "REPLACE_WITH_BASE64_ENCODED_32BYTE_KEY"

    # FZ-152: Audit
    AUDIT_LOG_RETENTION_DAYS: int = 365  # 1 year minimum per FZ-152

    # Archive: requests older than 30 days are auto-archived
    REQUEST_ARCHIVE_DAYS: int = 30
    REQUEST_ARCHIVE_NOTIFY_BEFORE_DAYS: int = 3  # notify 3 days before deletion

    # Admin panel
    ADMIN_SECRET_KEY: str = "REPLACE_WITH_ADMIN_SECRET"

    # Tesseract OCR
    TESSERACT_CMD: str = "/usr/bin/tesseract"
    OCR_LANGUAGE: str = "rus+eng"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
