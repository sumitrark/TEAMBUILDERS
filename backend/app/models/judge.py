from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Judge(Base):
    __tablename__ = "judges"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    hackathon_id: Mapped[UUID] = mapped_column(
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="active",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "hackathon_id",
            "user_id",
            name="uq_judge_hackathon_user",
        ),
    )