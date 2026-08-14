from sqlalchemy import (
    String,
    Text,
    Integer,
    Date,
    DateTime,
    Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, date
import uuid

from app.db.base import Base


class Hackathon(Base):
    __tablename__ = "hackathons"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)

    organizer: Mapped[str] = mapped_column(String(200))

    mode: Mapped[str] = mapped_column(String(50))
    location: Mapped[str] = mapped_column(String(200))

    team_size: Mapped[int] = mapped_column(Integer)

    difficulty: Mapped[str] = mapped_column(String(50))

    prize_pool: Mapped[str] = mapped_column(String(100))

    registration_deadline: Mapped[date] = mapped_column(Date)

    start_date: Mapped[date] = mapped_column(Date)

    end_date: Mapped[date] = mapped_column(Date)

    banner_image: Mapped[str] = mapped_column(
        String(500),
        default=""
    )

    website: Mapped[str] = mapped_column(
        String(500),
        default=""
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Open"
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )