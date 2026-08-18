from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user

from app.schemas.team import (
    TeamCreate,
    TeamResponse,
)

from app.schemas.team_hackathon import (
    TeamHackathonResponse,
)

from app.crud.team import (
    create_team,
    get_my_teams,
    update_team,
    delete_team,
    register_team_for_hackathon,
)


router = APIRouter(
    prefix="/teams",
    tags=["Teams"],
)


# =========================================================
# CREATE TEAM
# =========================================================

@router.post(
    "",
    response_model=TeamResponse,
)
async def create_new_team(
    team: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await create_team(
        db,
        current_user.id,
        team,
    )


# =========================================================
# GET MY TEAMS
# =========================================================

@router.get(
    "/my",
    response_model=list[TeamResponse],
)
async def my_teams(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_my_teams(
        db,
        current_user.id,
    )


# =========================================================
# REGISTER TEAM FOR HACKATHON
# =========================================================

@router.post(
    "/{team_id}/register/{hackathon_id}",
    response_model=TeamHackathonResponse,
)
async def register_team(
    team_id: UUID,
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await register_team_for_hackathon(
        db=db,
        team_id=team_id,
        owner_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result == "TEAM_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found or you are not the owner",
        )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found",
        )

    if result == "ALREADY_REGISTERED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team is already registered for this hackathon",
        )

    if result == "HACKATHON_INACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hackathon is inactive",
        )

    if result == "REGISTRATION_CLOSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hackathon registration is closed",
        )

    if result == "REGISTRATION_DEADLINE_PASSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hackathon registration deadline has passed",
        )

    if result == "TEAM_SIZE_EXCEEDED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Team exceeds the maximum allowed "
                "members for this hackathon"
            ),
        )

    if result == "MEMBER_SCHEDULE_CONFLICT":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "One or more team members are already "
                "participating in another hackathon "
                "during this hackathon's schedule"
            ),
        )

    return result


# =========================================================
# UPDATE TEAM
# =========================================================

@router.put(
    "/{team_id}",
    response_model=TeamResponse,
)
async def edit_team(
    team_id: UUID,
    team: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    updated_team = await update_team(
        db,
        team_id,
        current_user.id,
        team,
    )

    if updated_team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found or you are not the owner",
        )

    return updated_team


# =========================================================
# DELETE TEAM
# =========================================================

@router.delete(
    "/{team_id}",
)
async def remove_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = await delete_team(
        db,
        team_id,
        current_user.id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found or you are not the owner",
        )

    return {
        "message": "Team deleted successfully",
    }