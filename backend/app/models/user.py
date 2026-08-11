from sqlalchemy import String

from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_model import BaseModel


class User(Base, BaseModel):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(150))

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

    hashed_password: Mapped[str] = mapped_column(
        String(255),
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default="student",
    )