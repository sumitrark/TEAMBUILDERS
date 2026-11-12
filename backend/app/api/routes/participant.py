
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user

from app.crud.participant import (
    join_hackathon,
    get_my_hackathons,
    get_participant,
)
from app.crud.results import get_published_results

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

    if participant == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found",
        )

    if participant == "INDIVIDUAL_PARTICIPATION_NOT_ALLOWED":
        raise HTTPException(
            status_code=403,
            detail="This hackathon only allows team participation.",
        )

    if participant == "ALREADY_REGISTERED_WITH_TEAM":
        raise HTTPException(
            status_code=409,
            detail="You are already registered as a member of a team for this hackathon.",
        )

    if participant == "ALREADY_JOINED":
        raise HTTPException(
            status_code=409,
            detail="Already registered for this hackathon.",
        )

    if participant == "REGISTRATION_NOT_OPEN":
        raise HTTPException(
            status_code=400,
            detail="Registration has not started yet.",
        )

    if participant == "REGISTRATION_CLOSED":
        raise HTTPException(
            status_code=400,
            detail="Registration is closed.",
        )

    if participant == "HACKATHON_ALREADY_STARTED":
        raise HTTPException(
            status_code=400,
            detail="This hackathon has already started.",
        )

    if isinstance(participant, dict) and "CONFLICT" in participant:
        raise HTTPException(
            status_code=409,
            detail=participant["CONFLICT"],
        )

    return participant


@router.get("/my")
async def my_hackathons(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_my_hackathons(
        db=db,
        user_id=current_user.id,
    )


@router.get("/hackathons/{hackathon_id}/results")
async def results(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    participant = await get_participant(
        db=db,
        user_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if participant is None:
        raise HTTPException(
            status_code=403,
            detail="You must be registered for this hackathon to view its results.",
        )

    result = await get_published_results(
        db=db,
        hackathon_id=hackathon_id,
    )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found",
        )

    if result == "RESULTS_NOT_PUBLISHED":
        raise HTTPException(
            status_code=403,
            detail="Results have not been announced yet.",
        )

    return result
