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

    # Refresh tokens
    JWT_REFRESH_SECRET: str | None = None
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ==========================
    # SMS / OTP
    # ==========================
    SMS_PROVIDER: str = "console"
    MSG91_AUTH_KEY: str | None = None
    MSG91_TEMPLATE_ID: str | None = None

    OTP_EXPIRE_MINUTES: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    OTP_MAX_SENDS_PER_WINDOW: int = 5
    OTP_RATE_LIMIT_WINDOW_MINUTES: int = 60

    # ==========================
    # Email
    # ==========================
    # Left unset - no real email infrastructure exists yet. When
    # unset, invitation-sending endpoints return the invitation link
    # directly in the API response instead of pretending an email
    # was sent, so the organizer can copy/share it manually.
    EMAIL_PROVIDER: str | None = None

    # ==========================
    # AI
    # ==========================
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    AI_MAX_OUTPUT_TOKENS: int = 900

    AI_DAILY_CONTENT_LIMIT: int = 20
    AI_DAILY_EVALUATION_LIMIT: int = 30

    GITHUB_CONTEXT_MAX_CHARS: int = 6000

    # ==========================
    # Payments (Stripe)
    # ==========================
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_PUBLISHABLE_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_PRICE_ID_PRO: str | None = None



    # ==========================
    # Database
    # ==========================
    DATABASE_URL: str

    # ==========================
    # Frontend
    # ==========================
    FRONTEND_URL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()