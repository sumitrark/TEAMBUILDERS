from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_model import BaseModel


class User(Base, BaseModel):
    __tablename__ = "users"

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
    String(255),
    )

    course: Mapped[str] = mapped_column(
    String(255),
    )

    year: Mapped[str] = mapped_column(
    String(50),
    ) 

    hashed_password: Mapped[str] = mapped_column(
        String(255)
    )

    college: Mapped[str] = mapped_column(
        String(255)
    )

    course: Mapped[str] = mapped_column(
        String(150)
    )

    year: Mapped[int] = mapped_column()

    role: Mapped[str] = mapped_column(
        String(20),
        default="student",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )