from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

from app.schemas.hackathon import (
    HackathonCreate,
    HackathonResponse,
)

from app.crud.hackathon import (
    create_hackathon,
    get_all_hackathons,
    get_hackathon,
)

router = APIRouter(
    prefix="/hackathons",
    tags=["Hackathons"],
)


@router.post(
    "/",
    response_model=HackathonResponse,
)
async def create(
    payload: HackathonCreate,
    db: AsyncSession = Depends(get_db),
):
    return await create_hackathon(db, payload)


@router.get(
    "/",
    response_model=list[HackathonResponse],
)
async def all_hackathons(
    db: AsyncSession = Depends(get_db),
):
    return await get_all_hackathons(db)


@router.get(
    "/{hackathon_id}",
    response_model=HackathonResponse,
)
async def single_hackathon(
    hackathon_id,
    db: AsyncSession = Depends(get_db),
):
    return await get_hackathon(db, hackathon_id)