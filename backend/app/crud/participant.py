from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.participant import Participant
from app.models.hackathon import Hackathon
from app.services.achievement_service import award_achievement

async def get_my_hackathons(
    db: AsyncSession,
    user_id: UUID,
):
    result = await db.execute(
        select(Hackathon)
        .join(
            Participant,
            Participant.hackathon_id == Hackathon.id,
        )
        .where(
            Participant.user_id == user_id,
        )
    )

    return result.scalars().all()


async def get_participant(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
):
    result = await db.execute(
        select(Participant).where(
            Participant.user_id == user_id,
            Participant.hackathon_id == hackathon_id,
        )
    )

    return result.scalar_one_or_none()




async def join_hackathon(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
):
    from app.services.hackathon_lifecycle import (
        get_hackathon_status,
    )

    # 1. Verify hackathon exists.
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
        )
    )
    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    # 2. Check whether individual participation is allowed.
    participation_mode = (
        getattr(hackathon, "participation_mode", None) or "both"
    ).lower()

    if participation_mode not in ("individual", "both"):
        return "INDIVIDUAL_PARTICIPATION_NOT_ALLOWED"

    # 3. Verify registration window.
    lifecycle_status = get_hackathon_status(hackathon)

    if lifecycle_status != "REGISTRATION_OPEN":
        if lifecycle_status in ("DRAFT", "UPCOMING"):
            return "REGISTRATION_NOT_OPEN"

        if lifecycle_status == "LIVE":
            return "HACKATHON_ALREADY_STARTED"

        return "REGISTRATION_CLOSED"

    # 4. Check existing participation.
    existing = await get_participant(
        db,
        user_id,
        hackathon_id,
    )

    if existing is not None:
        if existing.team_id is not None:
            return "ALREADY_REGISTERED_WITH_TEAM"

        return "ALREADY_JOINED"

    # 5. Check schedule conflicts.
    result = await db.execute(
        select(Participant, Hackathon)
        .join(
            Hackathon,
            Participant.hackathon_id == Hackathon.id,
        )
        .where(
            Participant.user_id == user_id,
        )
    )

    existing_participations = result.all()

    for existing_participant, existing_hackathon in existing_participations:

        if existing_participant.status not in (
            "Joined",
            "joined",
            "registered",
            "Registered",
        ):
            continue

        if (
            existing_hackathon.start_date is None
            or existing_hackathon.end_date is None
            or hackathon.start_date is None
            or hackathon.end_date is None
        ):
            continue

        overlaps = (
            existing_hackathon.start_date <= hackathon.end_date
            and existing_hackathon.end_date >= hackathon.start_date
        )

        if overlaps:
            return {
                "CONFLICT": {
                    "message": "Hackathon schedule conflict",
                    "existing_hackathon": {
                        "id": str(existing_hackathon.id),
                        "title": existing_hackathon.title,
                        "start_date": existing_hackathon.start_date,
                        "end_date": existing_hackathon.end_date,
                    },
                    "requested_hackathon": {
                        "id": str(hackathon.id),
                        "title": hackathon.title,
                        "start_date": hackathon.start_date,
                        "end_date": hackathon.end_date,
                    },
                }
            }

    # 6. Create an individual participant.
    # Never create Team, TeamMember, or TeamHackathon here.
    participant = Participant(
        user_id=user_id,
        hackathon_id=hackathon_id,
        team_id=None,
        status="Joined",
    )

    db.add(participant)

    try:
        await db.commit()
        await db.refresh(participant)
    except Exception:
        await db.rollback()
        raise

    # 7. Award first-hackathon achievement.
    await award_achievement(
        db,
        user_id,
        "FIRST_HACKATHON",
    )

    return participant
