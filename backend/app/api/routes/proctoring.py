from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.notification import create_notification
from app.crud.participant import get_participant
from app.crud.proctoring import (
    STRIKE_THRESHOLD,
    dismiss_flag,
    disqualify_flagged_participant,
    get_flagged_participants,
    get_my_status,
    record_event,
)
from app.db.database import get_db
from app.dependencies.current_user import get_current_user
from app.dependencies.organizer import get_current_organizer
from app.models.face_reference_photo import FaceReferencePhoto
from app.models.hackathon import Hackathon
from app.models.identity_verification import IdentityVerification
from app.models.participant import Participant
from app.models.proctoring_event import ProctoringEvent
from app.models.user import User
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


# ---------------------------------------------------------------------------
# Participant event submission
# ---------------------------------------------------------------------------

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
        db,
        current_user.id,
        payload.hackathon_id,
    )

    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not registered for this hackathon.",
        )

    # Check identity verification before the initial
    # proctoring check-in.
    if payload.event_type == "check_in":
        verification_result = await db.execute(
            select(IdentityVerification).where(
                IdentityVerification.participant_id
                == participant.id
            )
        )

        verification = (
            verification_result.scalar_one_or_none()
        )

        if (
            verification is None
            or verification.status != "VERIFIED"
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Identity verification is required "
                    "before starting proctoring."
                ),
            )

        # A participant must also have a saved face
        # reference before starting proctoring.
        reference_result = await db.execute(
            select(FaceReferencePhoto).where(
                FaceReferencePhoto.user_id
                == current_user.id
            )
        )

        reference = (
            reference_result.scalar_one_or_none()
        )

        if reference is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "A face reference photo is required "
                    "before starting proctoring."
                ),
            )

    result = await record_event(
        db=db,
        user_id=current_user.id,
        hackathon_id=payload.hackathon_id,
        event_type=payload.event_type,
        face_detected=payload.face_detected,
        snapshot_data_url=payload.snapshot_data_url,
        face_match_status=payload.face_match_status,
        face_similarity=payload.face_similarity,
    )

    return {
        "strike_count": result["strike_count"],
        "strike_threshold": STRIKE_THRESHOLD,
        "newly_flagged_for_review": result[
            "newly_flagged_for_review"
        ],
        "message": result["message"],
    }


# ---------------------------------------------------------------------------
# Participant proctoring status
# ---------------------------------------------------------------------------

@router.get(
    "/my-status",
    response_model=MyProctoringStatusResponse,
)
async def my_proctoring_status(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await get_my_status(
        db,
        current_user.id,
        hackathon_id,
    )

    if result == "NOT_PARTICIPANT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not registered for this hackathon.",
        )

    return {
        "strike_count": result.proctoring_strikes,
        "strike_threshold": STRIKE_THRESHOLD,
        "flagged_for_review": result.flagged_for_review,
        "disqualified": False,
    }


# ---------------------------------------------------------------------------
# Organizer: flagged participants
# ---------------------------------------------------------------------------

@router.get(
    "/hackathons/{hackathon_id}/flagged",
    response_model=list[FlaggedParticipantResponse],
)
async def flagged_participants(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_organizer=Depends(get_current_organizer),
):
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id
            == current_organizer.id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found.",
        )

    return await get_flagged_participants(
        db,
        hackathon_id,
    )


# ---------------------------------------------------------------------------
# Organizer: proctoring monitor
# ---------------------------------------------------------------------------

@router.get(
    "/hackathons/{hackathon_id}/monitor",
    response_model=list[
        ProctoringMonitorParticipantResponse
    ],
)
async def proctoring_monitor(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_organizer=Depends(get_current_organizer),
):
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id
            == current_organizer.id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found.",
        )

    participant_result = await db.execute(
        select(
            Participant,
            User,
            IdentityVerification,
        )
        .join(
            User,
            User.id == Participant.user_id,
        )
        .outerjoin(
            IdentityVerification,
            IdentityVerification.participant_id
            == Participant.id,
        )
        .where(
            Participant.hackathon_id
            == hackathon_id
        )
    )

    rows = participant_result.all()

    response = []

    for participant, user, verification in rows:
        event_result = await db.execute(
            select(ProctoringEvent)
            .where(
                ProctoringEvent.hackathon_id
                == hackathon_id,
                ProctoringEvent.user_id
                == user.id,
            )
            .order_by(
                ProctoringEvent.created_at.desc()
            )
            .limit(10)
        )

        recent_events = (
            event_result.scalars().all()
        )

        last_event = (
            recent_events[0]
            if recent_events
            else None
        )

        response.append(
            {
                "user_id": user.id,
                "full_name": (
                    getattr(user, "full_name", None)
                    or user.email
                ),
                "email": user.email,
                "team_id": participant.team_id,
                "identity_status": (
                    verification.status
                    if verification
                    else "PENDING"
                ),
                "strike_count": (
                    participant.proctoring_strikes
                ),
                "flagged_for_review": (
                    participant.flagged_for_review
                ),
                "last_check_at": (
                    last_event.created_at
                    if last_event
                    else None
                ),
                "last_face_detected": (
                    last_event.face_detected
                    if last_event
                    else None
                ),
                "recent_events": [
                    {
                        "id": event.id,
                        "event_type": event.event_type,
                        "face_detected": (
                            event.face_detected
                        ),
                        "face_match_status": (
                            event.face_match_status
                        ),
                        "face_similarity": (
                            event.face_similarity
                        ),
                        "snapshot_data_url": (
                            event.snapshot_data_url
                        ),
                        "created_at": (
                            event.created_at
                        ),
                    }
                    for event in recent_events
                ],
            }
        )

    return response


# ---------------------------------------------------------------------------
# Organizer: delete a stored snapshot
# ---------------------------------------------------------------------------

@router.delete(
    "/hackathons/{hackathon_id}/events/{event_id}/snapshot"
)
async def delete_proctoring_snapshot(
    hackathon_id: UUID,
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Delete only the stored snapshot from a proctoring event.

    The proctoring event itself is preserved so that the
    event timestamp and review signals remain available.
    Only the hackathon organizer can perform this action.
    """

    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == current_user.id,
        )
    )

    hackathon = (
        hackathon_result.scalar_one_or_none()
    )

    if hackathon is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only the hackathon organizer can "
                "delete snapshots."
            ),
        )

    event_result = await db.execute(
        select(ProctoringEvent).where(
            ProctoringEvent.id == event_id,
            ProctoringEvent.hackathon_id
            == hackathon_id,
        )
    )

    event = event_result.scalar_one_or_none()

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proctoring event not found.",
        )

    if event.snapshot_data_url is None:
        return {
            "message": "Snapshot has already been deleted.",
            "event_id": str(event.id),
        }

    event.snapshot_data_url = None

    await db.commit()

    return {
        "message": "Snapshot deleted.",
        "event_id": str(event.id),
    }


# ---------------------------------------------------------------------------
# Organizer: dismiss review flag
# ---------------------------------------------------------------------------

@router.post(
    "/hackathons/{hackathon_id}/flagged/{user_id}/dismiss"
)
async def dismiss_participant_flag(
    hackathon_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_organizer=Depends(get_current_organizer),
):
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id
            == current_organizer.id,
        )
    )

    hackathon = (
        hackathon_result.scalar_one_or_none()
    )

    if hackathon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found.",
        )

    participant_result = await db.execute(
        select(Participant).where(
            Participant.hackathon_id
            == hackathon_id,
            Participant.user_id == user_id,
        )
    )

    participant = (
        participant_result.scalar_one_or_none()
    )

    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found.",
        )

    await dismiss_flag(
        db,
        participant,
    )

    return {
        "message": "Review flag dismissed.",
    }


# ---------------------------------------------------------------------------
# Organizer: disqualify participant
# ---------------------------------------------------------------------------

@router.post(
    "/hackathons/{hackathon_id}/flagged/{user_id}/disqualify"
)
async def disqualify_participant(
    hackathon_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_organizer=Depends(get_current_organizer),
):
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id
            == current_organizer.id,
        )
    )

    hackathon = (
        hackathon_result.scalar_one_or_none()
    )

    if hackathon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found.",
        )

    participant_result = await db.execute(
        select(Participant).where(
            Participant.hackathon_id
            == hackathon_id,
            Participant.user_id == user_id,
        )
    )

    participant = (
        participant_result.scalar_one_or_none()
    )

    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found.",
        )

    await disqualify_flagged_participant(
        db,
        participant,
    )

    await create_notification(
        db=db,
        user_id=user_id,
        title="Hackathon participation update",
        message=(
            f"You have been disqualified from "
            f"{hackathon.title} following organizer review."
        ),
        notification_type="system",
    )

    return {
        "message": "Participant disqualified.",
    }





