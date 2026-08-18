from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user

from app.crud.participant import (
    join_hackathon,
    get_my_hackathons,
)

from app.schemas.participant import ParticipantResponse


router = APIRouter(
    prefix="/participants",
    tags=["Participants"],
)


@router.post(
    "/join/{hackathon_id}",
    response_model=ParticipantResponse,
)
async def join(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    participant = await join_hackathon(
        db=db,
        user_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    # =====================================================
    # Hackathon not found
    # =====================================================

    if participant == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found",
        )

    # =====================================================
    # Already registered
    # =====================================================

    if participant == "ALREADY_JOINED":
        raise HTTPException(
            status_code=400,
            detail="Already registered for this hackathon",
        )

    # =====================================================
    # Schedule conflict
    # =====================================================

    if (
        isinstance(participant, dict)
        and "CONFLICT" in participant
    ):
        conflict = participant["CONFLICT"]

        raise HTTPException(
            status_code=409,
            detail=conflict,
        )

    return participant


@router.get(
    "/my",
)
async def my_hackathons(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_my_hackathons(
        db=db,
        user_id=current_user.id,
    )