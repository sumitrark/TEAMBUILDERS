from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Submission(Base):
    """
    A frozen snapshot of a project's state at the moment it was
    submitted. Distinct from Project itself so the submitted version
    is preserved even if the underlying Project row is later edited
    (edits are blocked post-submission anyway, but this keeps the
    submission record honest regardless). Each submit call creates a
    new row with an incrementing version_number - that IS the
    version history, no separate table needed.
    """

    __tablename__ = "submissions"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    project_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    team_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True,
    )

    hackathon_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    submitted_by: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # SUBMITTED | LOCKED | UNDER_REVIEW | EVALUATED
    status: Mapped[str] = mapped_column(
        String(20),
        default="SUBMITTED",
        nullable=False,
    )

    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Snapshotted fields - copied from Project at submit time, not
    # live-linked, so this row stays accurate even if Project changes.
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    technologies: Mapped[str | None] = mapped_column(Text, nullable=True)
    repository_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    demo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    presentation_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_tools_used: Mapped[str | None] = mapped_column(Text, nullable=True)

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
