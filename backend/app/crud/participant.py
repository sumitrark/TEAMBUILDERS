from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.participant import Participant
from sqlalchemy import select
from app.models.participant import Participant
from app.models.hackathon import Hackathon

async def get_my_hackathons(db, user_id):
    result = await db.execute(
        select(Hackathon)
        .join(
            Participant,
            Participant.hackathon_id == Hackathon.id
        )
        .where(Participant.user_id == user_id)
    )

    return result.scalars().all()

async def join_hackathon(db, user_id, hackathon_id):
    existing = await db.execute(
        select(Participant).where(
            Participant.user_id == user_id,
            Participant.hackathon_id == hackathon_id,
        )
    )

    if existing.scalar_one_or_none():
        return None

    participant = Participant(
        user_id=user_id,
        hackathon_id=hackathon_id,
    )

    db.add(participant)
    await db.commit()
    await db.refresh(participant)

    return participant