from uuid import UUID, uuid4
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OtpVerification(Base):
    """
    One row per (user, purpose) tracking the currently-active OTP
    challenge. Only a salted hash of the code is stored - never the
    raw OTP - and this row also carries the bookkeeping needed for
    expiry, attempt limiting, resend cooldown and per-window rate
    limiting, so a leaked DB row alone isn't enough to bypass those
    controls.
    """

    __tablename__ = "otp_verifications"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # e.g. "phone_verification". Kept generic so the same table can
    # later serve other OTP purposes (login 2FA, password reset)
    # without a schema change.
    purpose: Mapped[str] = mapped_column(
        String(30),
        default="phone_verification",
        nullable=False,
    )

    mobile_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    otp_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    salt: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    max_attempts: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
    )

    # How many OTPs have been sent within the current rate-limit
    # window, and when that window started.
    send_count: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    window_started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    last_sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        # One active challenge per user+purpose. Requesting a new
        # OTP updates this row in place rather than inserting a
        # duplicate.
        UniqueConstraint(
            "user_id",
            "purpose",
            name="uq_otp_verifications_user_purpose",
        ),
    )
