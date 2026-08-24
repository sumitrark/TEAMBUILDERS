from uuid import UUID, uuid4
from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PaymentTransaction(Base):
    """
    One row per checkout attempt. Created as "pending" the moment a
    Stripe Checkout Session is opened, then moved to
    succeeded/failed/canceled/refunded by webhook events - never by
    the frontend directly reporting success, since the frontend
    can't be trusted to tell the truth about a payment outcome.
    """

    __tablename__ = "payment_transactions"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    plan_code: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    stripe_checkout_session_id: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
    )

    stripe_payment_intent_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    amount_cents: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        default="usd",
        nullable=False,
    )

    # pending | succeeded | failed | canceled | refunded
    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False,
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
