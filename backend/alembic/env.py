from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.core.config import settings
from app.db.base import Base

# Import all models so Alembic can detect them
from app.models.user import User
from app.models.hackathon import Hackathon
from app.models.participant import Participant
from app.models.team import Team
from app.models.refresh_token import RefreshToken
from app.models.otp_verification import OtpVerification
from app.models.ai_evaluation import AiEvaluation
from app.models.payment_transaction import PaymentTransaction


config = context.config


# ---------------------------------------------------------
# Logging
# ---------------------------------------------------------

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# ---------------------------------------------------------
# Alembic metadata
# ---------------------------------------------------------

target_metadata = Base.metadata


# ---------------------------------------------------------
# Database URL
# ---------------------------------------------------------

database_url = settings.DATABASE_URL

# Alembic's online migration engine must be synchronous.
# Convert asyncpg URL to psycopg2 URL.
database_url = database_url.replace(
    "postgresql+asyncpg://",
    "postgresql://",
)

config.set_main_option(
    "sqlalchemy.url",
    database_url.replace("%", "%%"),
)


# ---------------------------------------------------------
# Offline migrations
# ---------------------------------------------------------

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""

    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named",
        },
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------
# Online migrations
# ---------------------------------------------------------

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------
# Run
# ---------------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()