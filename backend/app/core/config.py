from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ==========================
    # Project
    # ==========================
    PROJECT_NAME: str
    API_V1_PREFIX: str
    DEBUG: bool

    # ==========================
    # Security
    # ==========================
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Optional dedicated signing secret for refresh tokens. Falls back to
    # SECRET_KEY when not provided, so existing .env files keep working
    # without changes. Set this in production to limit blast radius if the
    # access-token secret is ever compromised.
    JWT_REFRESH_SECRET: str | None = None
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ==========================
    # Database
    # ==========================
    DATABASE_URL: str

    # Synchronous URL (Used only by Alembic)
    FRONTEND_URL = "http://localhost:3000"

    # ==========================
    # Frontend
    # ==========================
    FRONTEND_URL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()