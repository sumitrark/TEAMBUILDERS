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
    # =====================================================
    # 1. Check requested hackathon exists
    # =====================================================

    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    # =====================================================
    # 2. Check if already registered
    # =====================================================

    existing = await get_participant(
        db,
        user_id,
        hackathon_id,
    )

    if existing:
        return "ALREADY_JOINED"

    # =====================================================
    # 3. Check schedule conflicts
    #
    # A student cannot participate in two hackathons
    # whose dates overlap.
    # =====================================================

    result = await db.execute(
        select(
            Participant,
            Hackathon,
        )
        .join(
            Hackathon,
            Participant.hackathon_id
            == Hackathon.id,
        )
        .where(
            Participant.user_id == user_id,
        )
    )

    existing_participations = result.all()

    for (
        existing_participant,
        existing_hackathon,
    ) in existing_participations:

        # Ignore anything that isn't an active
        # participation.
        if existing_participant.status not in (
            "Joined",
            "joined",
            "registered",
            "Registered",
        ):
            continue

        # Date overlap:
        #
        # Existing starts before new ends
        # AND
        # Existing ends after new starts
        if (
            existing_hackathon.start_date
            <= hackathon.end_date
            and
            existing_hackathon.end_date
            >= hackathon.start_date
        ):
            return {
                "CONFLICT": {
                    "message": "Hackathon schedule conflict",
                    "existing_hackathon": {
                        "id": str(
                            existing_hackathon.id
                        ),
                        "title": existing_hackathon.title,
                        "start_date": (
                            existing_hackathon.start_date
                        ),
                        "end_date": (
                            existing_hackathon.end_date
                        ),
                    },
                    "requested_hackathon": {
                        "id": str(
                            hackathon.id
                        ),
                        "title": hackathon.title,
                        "start_date": (
                            hackathon.start_date
                        ),
                        "end_date": (
                            hackathon.end_date
                        ),
                    },
                }
            }

    # =====================================================
    # 4. Create registration
    # =====================================================

    participant = Participant(
        user_id=user_id,
        hackathon_id=hackathon_id,
        team_id=None,
        status="Joined",
    )

    db.add(participant)

    await db.commit()

    await db.refresh(participant)

    return participant