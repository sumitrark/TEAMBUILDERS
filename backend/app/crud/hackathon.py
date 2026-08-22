from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.organizer import get_current_organizer
from app.models.hackathon import Hackathon
from app.schemas.hackathon import (
    HackathonCreate,
    HackathonUpdate,
)


async def create_hackathon(
    db: AsyncSession,
    data: HackathonCreate,
    organizer_id,
):
    hackathon = Hackathon(
        **data.model_dump(),
        organizer_id=organizer_id,
    )

    db.add(hackathon)

    await db.commit()
    await db.refresh(hackathon)

    return hackathon


async def get_all_hackathons(
    db: AsyncSession,
):
    result = await db.execute(
        select(Hackathon)
        .order_by(
            Hackathon.created_at.desc()
        )
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


async def update_hackathon(
    db: AsyncSession,
    hackathon_id: UUID,
    organizer_id: UUID,
    data: HackathonUpdate,
):
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "NOT_FOUND"

    updates = data.model_dump(
        exclude_unset=True
    )

    for field, value in updates.items():
        setattr(
            hackathon,
            field,
            value,
        )

    await db.commit()
    await db.refresh(hackathon)

    return hackathon


async def delete_hackathon(
    db: AsyncSession,
    hackathon_id: UUID,
    organizer_id: UUID,
):
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "NOT_FOUND"

    # Soft-delete rather than physically deleting.
    hackathon.is_active = False
    hackathon.status = "Cancelled"

    await db.commit()

    return hackathon


async def set_hackathon_status(
    db: AsyncSession,
    hackathon_id: UUID,
    organizer_id: UUID,
    status: str,
):
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "NOT_FOUND"

    allowed_statuses = {
        "Open",
        "Closed",
        "Draft",
        "Completed",
        "Cancelled",
    }

    if status not in allowed_statuses:
        return "INVALID_STATUS"

    hackathon.status = status

    if status == "Cancelled":
        hackathon.is_active = False
    else:
        hackathon.is_active = True

    await db.commit()
    await db.refresh(hackathon)

    return hackathon