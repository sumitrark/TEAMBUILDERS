from sqlalchemy import (
    String,
    Text,
    Integer,
    Date,
    DateTime,
    Boolean,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, date, timezone
import uuid
import secrets
from app.db.base import Base


class Hackathon(Base):
    __tablename__ = "hackathons"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    # =====================================================
    # OWNERSHIP
    # =====================================================

    organizer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Kept for compatibility with existing participant UI
    organizer: Mapped[str] = mapped_column(
        String(200)
    )

    # =====================================================
    # BASIC INFORMATION
    # =====================================================

    title: Mapped[str] = mapped_column(
        String(200)
    )

    description: Mapped[str] = mapped_column(
        Text
    )

    mode: Mapped[str] = mapped_column(
        String(50)
    )

    location: Mapped[str] = mapped_column(
        String(200)
    )

    team_size: Mapped[int] = mapped_column(
        Integer
    )

    difficulty: Mapped[str] = mapped_column(
        String(50)
    )

    prize_pool: Mapped[str] = mapped_column(
        String(100)
    )

    # =====================================================
    # DATES
    # =====================================================

    registration_deadline: Mapped[date] = mapped_column(
        Date
    )

    start_date: Mapped[date] = mapped_column(
        Date
    )

    end_date: Mapped[date] = mapped_column(
        Date
    )

    # =====================================================
    # MEDIA
    # =====================================================

    banner_image: Mapped[str] = mapped_column(
        String(500),
        default="",
    )

    website: Mapped[str] = mapped_column(
        String(500),
        default="",
    )

    # =====================================================
    # STATUS
    # =====================================================

    status: Mapped[str] = mapped_column(
        String(30),
        default="Open",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    # =====================================================
    # TIMESTAMPS
    # =====================================================
    judge_invitation_code: Mapped[str] = mapped_column(
    String(100),
    unique=True,
    nullable=False,
    default=lambda: secrets.token_urlsafe(24),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )