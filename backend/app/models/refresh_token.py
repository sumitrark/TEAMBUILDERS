from uuid import UUID, uuid4
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RefreshToken(Base):
    """
    Server-side record of an issued refresh token.

    We never store the raw JWT - only a SHA-256 hash of it - so a database
    leak alone can't be used to mint sessions. This table is what makes
    rotation and revocation ("logout", "logout everywhere", stolen-token
    reuse detection) possible; a stateless JWT alone can't be revoked.
    """

    __tablename__ = "refresh_tokens"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Set when this token was rotated away in favor of a newer one.
    # If a request ever presents a token whose row already has
    # revoked_at set, that's a replay of an old token - treated as
    # a compromise signal (see revoke_all_refresh_tokens_for_user).
    replaced_by_token_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )
