from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user
from app.crud.user import update_user_profile
from app.schemas.user import (
    UserProfileUpdate,
    UserResponse,
)


router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)


@router.get(
    "",
    response_model=UserResponse,
)
async def get_profile(
    current_user=Depends(get_current_user),
):
    return current_user


@router.put(
    "",
    response_model=UserResponse,
)
async def update_profile(
    data: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Check whether another user already owns this username
    if data.username != current_user.username:
        from app.crud.user import get_user_by_username

        existing_user = await get_user_by_username(
            db,
            data.username,
        )

        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken",
            )

    try:
        updated_user = await update_user_profile(
            db,
            current_user,
            data,
        )

        return updated_user

    except IntegrityError:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )