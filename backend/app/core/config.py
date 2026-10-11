"""
Centralized application configuration.

Everything that varies between environments (dev/staging/prod) lives here,
loaded from environment variables / a .env file. Nothing else in the codebase
should call os.environ directly — import `settings` from here instead.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Database ---
    DATABASE_URL: str = "postgresql+psycopg2://financelens:financelens@localhost:5432/financelens"

    # --- JWT Auth ---
    JWT_SECRET_KEY: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- Gemini ---
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # --- App ---
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # --- Uploads ---
    MAX_UPLOAD_SIZE_MB: int = 15
    UPLOAD_DIR: str = "./uploads"

    # --- Device ingestion ---
    DEVICE_API_KEY_SALT: str = "dev-salt-change-me"
    # Secret used to encrypt device API keys at rest so they can be handed
    # out again through the pairing-code flow. Rotating it makes previously
    # stored keys undecryptable (devices must then be re-registered).
    DEVICE_KEY_ENCRYPTION_SECRET: str = "dev-device-key-encryption-secret-change-me"
    PAIRING_CODE_TTL_SECONDS: int = 180

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — env is read once per process."""
    return Settings()


settings = get_settings()
