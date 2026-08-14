from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hackathon import Hackathon
from app.schemas.hackathon import HackathonCreate


async def create_hackathon(
    db: AsyncSession,
    data: HackathonCreate,
):
    hackathon = Hackathon(**data.model_dump())

    db.add(hackathon)
    await db.commit()
    await db.refresh(hackathon)

    return hackathon


async def get_all_hackathons(db: AsyncSession):
    result = await db.execute(
        select(Hackathon).order_by(Hackathon.created_at.desc())
    )

    return result.scalars().all()


async def get_hackathon(
    db: AsyncSession,
    hackathon_id,
):
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id
        )
    )

    return result.scalar_one_or_none()