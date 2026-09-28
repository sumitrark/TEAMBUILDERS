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
from sqlalchemy import select

from app.models.face_reference_photo import FaceReferencePhoto
from app.schemas.face_reference_photo import (
    FaceReferencePhotoResponse,
    FaceReferencePhotoUpdate,
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


@router.get(
    "/face-reference",
    response_model=FaceReferencePhotoResponse | None,
)
async def get_face_reference_photo(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(FaceReferencePhoto).where(
            FaceReferencePhoto.user_id == current_user.id
        )
    )

    return result.scalar_one_or_none()


@router.put(
    "/face-reference",
    response_model=FaceReferencePhotoResponse,
)
async def save_face_reference_photo(
    data: FaceReferencePhotoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    photo = data.photo_data_url.strip()

    allowed_prefixes = (
        "data:image/jpeg;base64,",
        "data:image/png;base64,",
        "data:image/webp;base64,",
    )

    if not photo.startswith(allowed_prefixes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, or WebP images are supported.",
        )

    # Keep the demo reference image reasonably small.
    if len(photo) > 500_000:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Reference photo is too large. Please upload a smaller image.",
        )

    result = await db.execute(
        select(FaceReferencePhoto).where(
            FaceReferencePhoto.user_id == current_user.id
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        existing.photo_data_url = photo
    else:
        existing = FaceReferencePhoto(
            user_id=current_user.id,
            photo_data_url=photo,
        )
        db.add(existing)

    await db.commit()
    await db.refresh(existing)

    return existing


@router.delete(
    "/face-reference",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_face_reference_photo(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(FaceReferencePhoto).where(
            FaceReferencePhoto.user_id == current_user.id
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()

