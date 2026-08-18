from sqlalchemy import Boolean, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_model import BaseModel


class UserSettings(Base, BaseModel):
    __tablename__ = "user_settings"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    team_invitations: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    hackathon_reminders: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    ai_recommendations: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    profile_visibility: Mapped[str] = mapped_column(
        String(20),
        default="public",
        nullable=False,
    )