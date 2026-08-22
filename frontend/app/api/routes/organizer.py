from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.crud.organizer import get_organizer_analytics
from app.dependencies.organizer import get_current_organizer

from app.crud.organizer import (
    get_organizer_hackathons,
    get_organizer_stats,
    update_organizer_hackathon,
    delete_organizer_hackathon,
    toggle_hackathon_status,
    get_organizer_participants,
    get_organizer_teams,
    get_organizer_judges,
    invite_judge,
    remove_judge,
    get_organizer_analytics,
)

from app.schemas.organizer import (
    OrganizerStatsResponse,
    OrganizerHackathonUpdate,
)


router = APIRouter(
    prefix="/organizer",
    tags=["Organizer"],
)


# ============================================================
# DASHBOARD STATS
# ============================================================

@router.get(
    "/stats",
    response_model=OrganizerStatsResponse,
)
async def stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    return await get_organizer_stats(
        db=db,
        organizer_id=current_user.id,
    )


# ============================================================
# ORGANIZER HACKATHONS
# ============================================================

@router.get("/hackathons")
async def my_hackathons(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    return await get_organizer_hackathons(
        db=db,
        organizer_id=current_user.id,
    )


# ============================================================
# UPDATE HACKATHON
# ============================================================

@router.put("/hackathons/{hackathon_id}")
async def update_hackathon(
    hackathon_id: UUID,
    payload: OrganizerHackathonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await update_organizer_hackathon(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
        data=payload,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return result


# ============================================================
# DELETE HACKATHON
# ============================================================

@router.delete("/hackathons/{hackathon_id}")
async def delete_hackathon(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    deleted = await delete_organizer_hackathon(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return {
        "message": "Hackathon deleted successfully"
    }


# ============================================================
# OPEN / CLOSE HACKATHON
# ============================================================

@router.patch("/hackathons/{hackathon_id}/status")
async def change_hackathon_status(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await toggle_hackathon_status(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return result


# ============================================================
# PARTICIPANTS
# ============================================================

@router.get(
    "/hackathons/{hackathon_id}/participants"
)
async def participants(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await get_hackathon_participants(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return result


# ============================================================
# TEAMS
# ============================================================

@router.get(
    "/hackathons/{hackathon_id}/teams"
)
async def teams(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await get_hackathon_teams(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return result


# ============================================================
# JUDGES
# ============================================================

@router.get(
    "/hackathons/{hackathon_id}/judges"
)
async def judges(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await get_hackathon_judges(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return result


# ============================================================
# INVITE JUDGE
# ============================================================

@router.post(
    "/hackathons/{hackathon_id}/judges/invite"
)
async def send_judge_invitation(
    hackathon_id: UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    email = payload.get("email")

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Judge email is required",
        )

    result = await invite_judge(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
        email=email,
    )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    if result == "USER_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="No user exists with this email",
        )

    if result == "ALREADY_JUDGE":
        raise HTTPException(
            status_code=409,
            detail="User is already a judge for this hackathon",
        )

    if result == "CONFLICT":
        raise HTTPException(
            status_code=409,
            detail="Judge has a schedule conflict",
        )

    return result

# ============================================================
# REMOVE JUDGE
# ============================================================

@router.delete(
    "/hackathons/{hackathon_id}/judges/{judge_id}"
)
async def delete_judge(
    hackathon_id: UUID,
    judge_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await remove_judge(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
        judge_id=judge_id,
    )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    if result == "JUDGE_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Judge not found",
        )

    return {
        "message": "Judge removed successfully"
    }

@router.get(
    "/hackathons/{hackathon_id}/analytics",
)
async def hackathon_analytics(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await get_organizer_analytics(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found or you do not own it",
        )

    return result