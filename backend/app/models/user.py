from sqlalchemy import String, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base_model import BaseModel


class User(Base, BaseModel):
    __tablename__ = "users"

    # -------------------------
    # Basic Information
    # -------------------------

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    # -------------------------
    # Participant Information
    # -------------------------

    college: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    course: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    year: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    # -------------------------
    # Organizer Information
    # -------------------------

    organization: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    designation: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    # -------------------------
    # Authentication
    # -------------------------

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default="student",
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # -------------------------
    # Profile Information
    # -------------------------

    bio: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    github_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    linkedin_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    portfolio_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # -------------------------
    # AI Matchmaking Information
    # -------------------------

    skills: Mapped[list[str] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    preferred_roles: Mapped[list[str] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    # -------------------------
    # Relationships
    # -------------------------

    teams = relationship(
        "Team",
        back_populates="owner",
    )