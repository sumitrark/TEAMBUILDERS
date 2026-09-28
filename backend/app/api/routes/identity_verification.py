from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.current_user import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.identity_verification import IdentityVerificationResponse
from app.services.identity_verification import (
    get_or_create_verification,
    verify_identity,
)
from app.crud.participant import get_participant


router = APIRouter(
    prefix="/identity-verification",
    tags=["Identity Verification"],
)


@router.get(
    "/{hackathon_id}",
    response_model=IdentityVerificationResponse,
)
async def get_identity_verification(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    participant = await get_participant(
        db,
        current_user.id,
        hackathon_id,
    )

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not registered for this hackathon.",
        )

    return await get_or_create_verification(db, participant)


@router.post(
    "/{hackathon_id}/start",
    response_model=IdentityVerificationResponse,
)
async def start_identity_verification(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    participant = await get_participant(
        db,
        current_user.id,
        hackathon_id,
    )

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not registered for this hackathon.",
        )

    return await verify_identity(db, participant)

