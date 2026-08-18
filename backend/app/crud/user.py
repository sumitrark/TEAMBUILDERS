from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserProfileUpdate


async def get_user_by_email(
    db: AsyncSession,
    email: str,
):
    result = await db.execute(
        select(User).where(
            User.email == email
        )
    )

    return result.scalar_one_or_none()


async def get_user_by_username(
    db: AsyncSession,
    username: str,
):
    result = await db.execute(
        select(User).where(
            User.username == username
        )
    )

    return result.scalar_one_or_none()


async def get_user_by_id(
    db: AsyncSession,
    user_id: UUID,
):
    result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    user: User,
):
    db.add(user)

    await db.commit()

    await db.refresh(user)

    return user


async def update_user_profile(
    db: AsyncSession,
    user: User,
    data: UserProfileUpdate,
):
    # Update basic information
    user.full_name = data.full_name
    user.username = data.username
    user.college = data.college
    user.course = data.course
    user.year = data.year

    # Update professional profile
    user.bio = data.bio
    user.github_url = data.github_url
    user.linkedin_url = data.linkedin_url
    user.portfolio_url = data.portfolio_url

    # Update matchmaking information
    user.skills = data.skills
    user.preferred_roles = data.preferred_roles

    await db.commit()

    await db.refresh(user)

    return user