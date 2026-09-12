import secrets
from uuid import uuid4
from datetime import datetime, timedelta, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

INVITATION_EXPIRY_DAYS = 14


def _generate_token() -> str:
    # 32 bytes of CSPRNG entropy, url-safe - non-guessable and short
    # enough to be a clean /judge/invite/<token> link.
    return secrets.token_urlsafe(32)


def _default_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=INVITATION_EXPIRY_DAYS)


class JudgeInvitation(Base):
    """
    The invitation itself - decoupled from the Judge (active
    assignment) row, so we can invite someone who doesn't have an
    account yet. A Judge row is only ever created once this
    invitation is explicitly accepted.
    """

    __tablename__ = "judge_invitations"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    hackathon_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    organizer_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    invited_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    # Resolved at invite time if an account already existed. Even if
    # the account is created *after* the invite (case B), we still
    # match on invited_email at accept time rather than relying on
    # this being backfilled, since backfilling correctly would need
    # its own hook into registration.
    invited_user_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
        default=_generate_token,
    )

    # pending | accepted | declined | expired | cancelled
    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_default_expiry,
        nullable=False,
    )

    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    declined_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    hackathon = relationship("Hackathon")

    organizer = relationship(
        "User",
        foreign_keys=[organizer_id],
    )

    invited_user = relationship(
        "User",
        foreign_keys=[invited_user_id],
    )
