
from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import (
    String,
    Text,
    Integer,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    max_members: Mapped[int] = mapped_column(
        Integer,
        default=4,
        nullable=False,
    )

    owner_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    hackathon_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id"),
        nullable=True,
    )

    # Skills selected by the team owner from the shared catalogue.
    required_skills: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships

    owner = relationship(
        "User",
        back_populates="teams",
    )

    hackathon = relationship(
        "Hackathon",
    )
