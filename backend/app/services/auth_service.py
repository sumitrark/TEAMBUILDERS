from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.crud.user import (
    create_user,
    get_user_by_email,
)
from app.models.user import User
from app.schemas.user import UserLogin, UserRegister


async def register_user(
    db: AsyncSession,
    payload: UserRegister,
) -> User:

    existing_user = await get_user_by_email(
        db,
        payload.email,
    )

    if existing_user:
        raise ValueError("Email already registered")

    username = payload.email.split("@", 1)[0]

    user = User(
        full_name=payload.full_name,
        username=username,
        email=payload.email,
        college=payload.college,
        course=payload.course,
        year=payload.year,
        hashed_password=hash_password(payload.password),
        role="student",
        is_active=True,
    )

    return await create_user(db, user)


async def authenticate_user(
    db: AsyncSession,
    payload: UserLogin,
) -> User:

    user = await get_user_by_email(
        db,
        payload.email,
    )

    if not user:
        raise ValueError("Invalid email or password")

    if not verify_password(
        payload.password,
        user.hashed_password,
    ):
        raise ValueError("Invalid email or password")

    if not user.is_active:
        raise ValueError("User account is inactive")

    return user


def generate_tokens(user: User) -> dict:
    subject = str(user.id)

    return {
        "access_token": create_access_token(subject),
        "refresh_token": create_refresh_token(subject),
        "token_type": "bearer",
    }