from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user
from app.crud.participant import (
    join_hackathon,
    get_my_hackathons,
)

router = APIRouter(
    prefix="/participants",
    tags=["Participants"],
)

@router.post("/join/{hackathon_id}")
async def join(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    participant = await join_hackathon(
        db,
        current_user.id,
        hackathon_id,
    )

    if participant is None:
        raise HTTPException(
            status_code=400,
            detail="Already joined",
        )

    return participant


@router.get("/my")
async def my_hackathons(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_my_hackathons(
        db,
        current_user.id,
    )