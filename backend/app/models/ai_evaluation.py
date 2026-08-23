from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AiEvaluation(Base):
    """
    AI-assisted evaluation of a project. This is explicitly a
    supplement for human judges, never a replacement - it's always
    labeled "AI-assisted" in API responses and the human Evaluation
    table remains the authoritative score.

    One row per project: regenerating overwrites the previous AI
    evaluation rather than accumulating history, since only the
    latest AI read is useful to a judge.
    """

    __tablename__ = "ai_evaluations"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    project_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    requested_by_user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    innovation_score: Mapped[int] = mapped_column(Integer, nullable=False)
    technical_score: Mapped[int] = mapped_column(Integer, nullable=False)
    impact_score: Mapped[int] = mapped_column(Integer, nullable=False)
    feasibility_score: Mapped[int] = mapped_column(Integer, nullable=False)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)

    ui_ux_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    strengths: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    weaknesses: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    suggestions: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    potential_issues: Mapped[list[str]] = mapped_column(JSON, nullable=False)

    model_name: Mapped[str] = mapped_column(String(50), nullable=False)

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
