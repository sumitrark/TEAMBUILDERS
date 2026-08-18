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
        String(150)
    )

    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
    )

    college: Mapped[str] = mapped_column(
        String(255)
    )

    course: Mapped[str] = mapped_column(
        String(150)
    )

    year: Mapped[int] = mapped_column()

    # -------------------------
    # Authentication
    # -------------------------

    hashed_password: Mapped[str] = mapped_column(
        String(255)
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default="student",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
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