from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

from app.dependencies.organizer import (
    get_current_organizer,
)

from app.schemas.hackathon import (
    HackathonCreate,
    HackathonResponse,
    HackathonUpdate,
)

from app.crud.hackathon import (
    create_hackathon,
    get_all_hackathons,
    get_hackathon,
    update_hackathon,
    delete_hackathon,
    set_hackathon_status,
)


router = APIRouter(
    prefix="/hackathons",
    tags=["Hackathons"],
)


# =========================================================
# PUBLIC / PARTICIPANT
# =========================================================

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
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    hackathon = await get_hackathon(
        db,
        hackathon_id,
    )

    if hackathon is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found",
        )

    return hackathon


# =========================================================
# ORGANIZER - CREATE
# =========================================================

@router.post(
    "/organizer/create",
    response_model=HackathonResponse,
)
async def organizer_create(
    payload: HackathonCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    return await create_hackathon(
        db=db,
        data=payload,
        organizer_id=current_user.id,
    )


# =========================================================
# ORGANIZER - UPDATE
# =========================================================

@router.put(
    "/organizer/{hackathon_id}",
    response_model=HackathonResponse,
)
async def organizer_update(
    hackathon_id: UUID,
    payload: HackathonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await update_hackathon(
        db=db,
        hackathon_id=hackathon_id,
        organizer_id=current_user.id,
        data=payload,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or access denied",
        )

    return result


# =========================================================
# ORGANIZER - DELETE
# =========================================================

@router.delete(
    "/organizer/{hackathon_id}",
)
async def organizer_delete(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await delete_hackathon(
        db=db,
        hackathon_id=hackathon_id,
        organizer_id=current_user.id,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or access denied",
        )

    return {
        "message": "Hackathon cancelled successfully"
    }


# =========================================================
# ORGANIZER - STATUS
# =========================================================

@router.patch(
    "/organizer/{hackathon_id}/status",
    response_model=HackathonResponse,
)
async def organizer_status(
    hackathon_id: UUID,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await set_hackathon_status(
        db=db,
        hackathon_id=hackathon_id,
        organizer_id=current_user.id,
        status=status,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or access denied",
        )

    if result == "INVALID_STATUS":
        raise HTTPException(
            status_code=400,
            detail="Invalid hackathon status",
        )

    return result