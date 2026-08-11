from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate


class UserRepository:

    @staticmethod
    async def get_by_email(
        db: AsyncSession,
        email: str
    ):

        result = await db.execute(
            select(User).where(User.email == email)
        )

        return result.scalar_one_or_none()


    @staticmethod
    async def get_by_username(
        db: AsyncSession,
        username: str
    ):

        result = await db.execute(
            select(User).where(User.username == username)
        )

        return result.scalar_one_or_none()


    @staticmethod
    async def create_user(
        db: AsyncSession,
        user: User
    ):

        db.add(user)

        await db.commit()

        await db.refresh(user)

        return user