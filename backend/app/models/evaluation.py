from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    project_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    judge_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    innovation_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    technical_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    impact_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    presentation_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    overall_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    criterion_scores: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    feedback: Mapped[str | None] = mapped_column(
        Text,
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

    project = relationship("Project")
    judge = relationship("User")
