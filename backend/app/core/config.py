from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    """
    Application Settings
    Equivalent to Spring Boot's @ConfigurationProperties or application.yml
    Reads from environment variables and .env file.
    """
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/receipt_dashboard.db"
    SECRET_KEY: str = "change-this-to-a-super-secret-hex-key-in-production-1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    MAX_UPLOAD_SIZE_MB: int = 10
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


settings = Settings()
