from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.proctoring_event import ProctoringEvent
from app.models.participant import Participant
from app.crud.notification import create_notification

# Reaching this many "face not detected" events flags the
# participant for organizer review. This never triggers automatic
# removal - the underlying signal (a face isn't visible in frame,
# as reported by the client's own browser detection) is too easy to
# trigger through ordinary, legitimate behavior (adjusting a laptop,
# poor lighting, looking at a second monitor) to justify
# unsupervised punitive action.
STRIKE_THRESHOLD = 3


async def get_participant(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
) -> Participant | None:
    result = await db.execute(
        select(Participant).where(
            Participant.user_id == user_id,
            Participant.hackathon_id == hackathon_id,
        )
    )

    return result.scalar_one_or_none()


async def record_event(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
    event_type: str,
    face_detected: bool,
    snapshot_data_url: str | None,
):
    participant = await get_participant(db, user_id, hackathon_id)

    if participant is None:
        return "NOT_PARTICIPANT"

    event = ProctoringEvent(
        hackathon_id=hackathon_id,
        user_id=user_id,
        event_type=event_type,
        face_detected=face_detected,
        snapshot_data_url=snapshot_data_url,
    )

    db.add(event)

    newly_flagged = False

    if not face_detected:
        participant.proctoring_strikes += 1

        if (
            participant.proctoring_strikes >= STRIKE_THRESHOLD
            and not participant.flagged_for_review
        ):
            participant.flagged_for_review = True
            newly_flagged = True

    await db.flush()

    if newly_flagged:
        from app.models.hackathon import Hackathon
        from app.models.user import User

        hackathon_result = await db.execute(
            select(Hackathon).where(Hackathon.id == hackathon_id)
        )
        hackathon = hackathon_result.scalar_one_or_none()

        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()

        if hackathon and hackathon.organizer_id:
            await create_notification(
                db=db,
                user_id=hackathon.organizer_id,
                notification_type="proctoring_flag",
                title="Participant Flagged for Review",
                message=(
                    f"{user.full_name if user else 'A participant'} has "
                    f"triggered {STRIKE_THRESHOLD} presence-check flags "
                    f"during '{hackathon.title}'. This is not automatic "
                    f"disqualification - please review before taking "
                    f"any action."
                ),
                action_url=(
                    f"/organizer/hackathons/{hackathon_id}/proctoring"
                ),
            )

    await db.commit()
    await db.refresh(event)
    await db.refresh(participant)

    return {
        "event": event,
        "strike_count": participant.proctoring_strikes,
        "newly_flagged_for_review": newly_flagged,
    }


async def get_my_status(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
):
    participant = await get_participant(db, user_id, hackathon_id)

    if participant is None:
        return "NOT_PARTICIPANT"

    return participant


async def get_flagged_participants(
    db: AsyncSession,
    hackathon_id: UUID,
):
    from app.models.user import User

    result = await db.execute(
        select(Participant, User)
        .join(User, Participant.user_id == User.id)
        .where(
            Participant.hackathon_id == hackathon_id,
            Participant.flagged_for_review == True,  # noqa: E712
        )
    )

    rows = result.all()

    output = []

    for participant, user in rows:
        events_result = await db.execute(
            select(ProctoringEvent)
            .where(
                ProctoringEvent.hackathon_id == hackathon_id,
                ProctoringEvent.user_id == user.id,
                ProctoringEvent.face_detected == False,  # noqa: E712
            )
            .order_by(ProctoringEvent.created_at.desc())
            .limit(5)
        )

        recent_events = events_result.scalars().all()

        output.append(
            {
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "strike_count": participant.proctoring_strikes,
                "recent_flagged_events": recent_events,
            }
        )

    return output


async def dismiss_flag(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    user_id: UUID,
):
    """Organizer reviewed the flag and it was a false positive /
    non-issue - clears it and resets the strike count."""
    from app.models.hackathon import Hackathon

    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    if hackathon_result.scalar_one_or_none() is None:
        return "HACKATHON_NOT_FOUND"

    participant = await get_participant(db, user_id, hackathon_id)

    if participant is None:
        return "PARTICIPANT_NOT_FOUND"

    participant.flagged_for_review = False
    participant.proctoring_strikes = 0

    await db.commit()
    await db.refresh(participant)

    return participant


async def disqualify_flagged_participant(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    user_id: UUID,
):
    """
    Organizer's own explicit, logged judgment call after reviewing a
    flag - never an automatic consequence of hitting the strike
    threshold.
    """
    from app.models.hackathon import Hackathon

    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    if hackathon_result.scalar_one_or_none() is None:
        return "HACKATHON_NOT_FOUND"

    participant = await get_participant(db, user_id, hackathon_id)

    if participant is None:
        return "PARTICIPANT_NOT_FOUND"

    participant.status = "Disqualified"
    participant.flagged_for_review = False

    await db.commit()
    await db.refresh(participant)

    return participant
