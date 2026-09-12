from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user
from app.dependencies.organizer import get_current_organizer

from app.crud.participant import get_participant
from app.crud.notification import create_notification
from app.crud.proctoring import (
    STRIKE_THRESHOLD,
    dismiss_flag,
    disqualify_flagged_participant,
    get_flagged_participants,
    get_my_status,
    record_event,
)
from app.models.hackathon import Hackathon
from sqlalchemy import select

from app.schemas.proctoring import (
    FlaggedParticipantResponse,
    MyProctoringStatusResponse,
    ProctoringEventCreate,
    ProctoringEventResponse,
)

router = APIRouter(
    prefix="/proctoring",
    tags=["Proctoring"],
)


@router.post(
    "/events",
    response_model=ProctoringEventResponse,
)
async def submit_event(
    payload: ProctoringEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    participant = await get_participant(
        db, current_user.id, payload.hackathon_id
    )

    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not registered for this hackathon",
        )

    result = await record_event(
        db,
        user_id=current_user.id,
        hackathon_id=payload.hackathon_id,
        event_type=payload.event_type,
        face_detected=payload.face_detected,
        snapshot_data_url=payload.snapshot_data_url,
    )

    # Note: record_event() already creates the "flagged for review"
    # notification internally when the strike threshold is crossed -
    # do not duplicate it here.

    message = (
        "Face not detected - this has been logged."
        if not payload.face_detected
        else "Check-in recorded."
    )

    return {
        "strike_count": result["strike_count"],
        "strike_threshold": STRIKE_THRESHOLD,
        "newly_flagged_for_review": result["newly_flagged_for_review"],
        "message": message,
    }


@router.get(
    "/my-status",
    response_model=MyProctoringStatusResponse,
)
async def my_status(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await get_my_status(db, current_user.id, hackathon_id)

    if result == "NOT_PARTICIPANT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not registered for this hackathon",
        )

    return {
        "strike_count": result.proctoring_strikes,
        "strike_threshold": STRIKE_THRESHOLD,
        "flagged_for_review": result.flagged_for_review,
    }


@router.get(
    "/hackathons/{hackathon_id}/flagged",
    response_model=list[FlaggedParticipantResponse],
)
async def flagged_participants(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == current_user.id,
        )
    )

    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found or you do not own it",
        )

    return await get_flagged_participants(db, hackathon_id)


@router.post("/hackathons/{hackathon_id}/flagged/{user_id}/dismiss")
async def dismiss_participant_flag(
    hackathon_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await dismiss_flag(
        db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
        user_id=user_id,
    )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found or you do not own it",
        )

    if result == "PARTICIPANT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found",
        )

    return {"message": "Flag dismissed", "status": result.status}


@router.post("/hackathons/{hackathon_id}/flagged/{user_id}/disqualify")
async def disqualify_participant(
    hackathon_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await disqualify_flagged_participant(
        db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
        user_id=user_id,
    )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found or you do not own it",
        )

    if result == "PARTICIPANT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found",
        )

    hackathon_result = await db.execute(
        select(Hackathon).where(Hackathon.id == hackathon_id)
    )
    hackathon = hackathon_result.scalar_one_or_none()

    # Always tell the person directly - never a silent removal.
    await create_notification(
        db=db,
        user_id=user_id,
        notification_type="proctoring_disqualified",
        title="Hackathon Participation Update",
        message=(
            f"An organizer has disqualified your participation in "
            f"'{hackathon.title if hackathon else 'this hackathon'}' "
            f"following a proctoring review. Contact the organizer "
            f"if you believe this is a mistake."
        ),
        action_url="/dashboard/hackathons",
    )
    await db.commit()

    return {"message": "Participant disqualified", "status": result.status}
