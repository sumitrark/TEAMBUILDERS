from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user
from app.dependencies.organizer import get_current_organizer
from app.models.face_reference_photo import FaceReferencePhoto
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
from app.models.identity_verification import IdentityVerification
from app.models.participant import Participant
from app.models.proctoring_event import ProctoringEvent
from app.models.user import User
from sqlalchemy import select

from app.schemas.proctoring import (
    FlaggedParticipantResponse,
    MyProctoringStatusResponse,
    ProctoringEventCreate,
    ProctoringEventResponse,
    ProctoringMonitorParticipantResponse,
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

    # A camera check confirms current presence only after the registered
    # participant has completed the identity-verification step.
    if payload.event_type == "check_in":
        verification_result = await db.execute(
            select(IdentityVerification).where(
                IdentityVerification.participant_id == participant.id
            )
        )
        verification = verification_result.scalar_one_or_none()

        if verification is None or verification.status != "VERIFIED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Identity verification is required before camera "
                    "presence verification."
                ),
            )

    result = await record_event(
    db,
    user_id=current_user.id,
    hackathon_id=payload.hackathon_id,
    event_type=payload.event_type,
    face_detected=payload.face_detected,
    snapshot_data_url=payload.snapshot_data_url,
    face_match_status=payload.face_match_status,
    face_similarity=payload.face_similarity,
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


@router.get(
    "/hackathons/{hackathon_id}/monitor",
    response_model=list[ProctoringMonitorParticipantResponse],
)
async def proctoring_monitor(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    # Verify organizer ownership.
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

    result = await db.execute(
        select(
            Participant,
            User,
            IdentityVerification.status,
        )
        .join(User, Participant.user_id == User.id)
        .outerjoin(
            IdentityVerification,
            IdentityVerification.participant_id == Participant.id,
        )
        .where(Participant.hackathon_id == hackathon_id)
        .order_by(User.full_name)
    )

    rows = result.all()
    response = []

    for participant, user, identity_status in rows:
        events_result = await db.execute(
            select(ProctoringEvent)
            .where(
                ProctoringEvent.hackathon_id == hackathon_id,
                ProctoringEvent.user_id == user.id,
            )
            .order_by(ProctoringEvent.created_at.desc())
            .limit(10)
        )

        events = events_result.scalars().all()
        latest = events[0] if events else None

        response.append(
            {
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "team_id": participant.team_id,
                "identity_status": identity_status or "PENDING",
                "strike_count": participant.proctoring_strikes,
                "flagged_for_review": participant.flagged_for_review,
                "last_check_at": latest.created_at if latest else None,
                "last_face_detected": (
                    latest.face_detected if latest else None
                ),
                "recent_events": [
                    {
                        "id": event.id,
                        "event_type": event.event_type,
                        "face_detected": event.face_detected,
                        "snapshot_data_url": event.snapshot_data_url,
                        "created_at": event.created_at,
                    }
                    for event in events
                ],
            }
        )

    return response


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
