from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Hard cap on stored snapshot size (a base64 data URL). This is a
# lightweight presence log for organizer review, not a video
# recording system - snapshots are small, compressed JPEG thumbnails.
MAX_SNAPSHOT_DATA_URL_LENGTH = 300_000


class ProctoringEvent(Base):
    """
    One row per webcam check-in or periodic-snapshot event during a
    live hackathon session. face_detected is determined client-side
    by the browser's own face detection and simply trusted/recorded
    here - the backend has no independent way to verify it. This is
    an audit log for human review, not an automated enforcement
    mechanism - see Participant.flagged_for_review, which is only
    ever a signal for an organizer to look into, never a removal
    trigger.
    """

    __tablename__ = "proctoring_events"

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

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # check_in | periodic_snapshot
    event_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    face_detected: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )

    # A base64 data URL (e.g. "data:image/jpeg;base64,..."), capped
    # in size at the API layer. Nullable so a client can report a
    # detection result without necessarily attaching a frame.
    snapshot_data_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    hackathon = relationship("Hackathon")
    user = relationship("User")
