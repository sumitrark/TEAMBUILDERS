from datetime import datetime, timezone
import uuid

from sqlalchemy import DateTime, ForeignKey, String, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    hackathon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id"),
        nullable=False,
    )

    # Team selected by this participant
    team_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id"),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Joined",
        nullable=False,
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # -------------------------
    # Proctoring
    # -------------------------
    # Strikes accumulate from automated "face not detected" events
    # during a live session. Reaching the threshold flags the
    # participant for a HUMAN organizer to review and decide on -
    # it never triggers automatic removal. The heuristic behind
    # this (face visibility) is not reliable enough to justify
    # unsupervised punitive action.
    proctoring_strikes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    flagged_for_review: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    user = relationship(
        "User",
    )

    hackathon = relationship(
        "Hackathon",
    )

    team = relationship(
        "Team",
    )