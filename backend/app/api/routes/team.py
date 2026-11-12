
from uuid import UUID
from app.services.team_matching import check_team_schedule_conflicts
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user
from app.services.team_matching import check_team_schedule_conflicts
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
    get_team,
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

    # -----------------------------------------------------
    # NOT FOUND
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # DUPLICATE REGISTRATION
    # -----------------------------------------------------

    if result == "ALREADY_REGISTERED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Team is already registered for this hackathon",
        )

    if result == "MEMBER_ALREADY_REGISTERED_INDIVIDUALLY":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A team member is already registered individually "
                "for this hackathon"
            ),
        )

    if result == "MEMBER_ALREADY_REGISTERED_WITH_ANOTHER_TEAM":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A team member is already registered with another team "
                "for this hackathon"
            ),
        )

    # -----------------------------------------------------
    # HACKATHON AVAILABILITY
    # -----------------------------------------------------

    if result == "HACKATHON_INACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hackathon is inactive",
        )

    if result == "REGISTRATION_NOT_OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hackathon registration has not opened yet",
        )

    if result == "REGISTRATION_CLOSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hackathon registration is closed",
        )

    if result == "HACKATHON_ALREADY_STARTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hackathon has already started",
        )

    # -----------------------------------------------------
    # TEAM SIZE
    # -----------------------------------------------------

    if result == "TEAM_SIZE_EXCEEDED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Team exceeds the maximum allowed member count"
            ),
        )

    # -----------------------------------------------------
    # SCHEDULE CONFLICT
    # -----------------------------------------------------

    if result == "MEMBER_SCHEDULE_CONFLICT":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "One or more team members are already participating "
                "in another hackathon during this schedule"
            ),
        )

    if result == "TEAM_PARTICIPATION_NOT_ALLOWED":
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="This hackathon does not allow team participation",
    )

    if result == "TEAM_ALREADY_ASSIGNED_TO_ANOTHER_HACKATHON":
       raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="This team is already assigned to another hackathon",
    )
    # -----------------------------------------------------
    # SUCCESS
    # -----------------------------------------------------

    return result


# =========================================================
# GET SINGLE TEAM
# =========================================================

@router.get(
    "/{team_id}",
    response_model=TeamResponse,
)
async def get_single_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    team = await get_team(
        db,
        team_id,
        current_user.id,
    )

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    return team




# =========================================================
# TEAM SCHEDULE CHECK
# =========================================================

@router.get("/{team_id}/schedule-check/{hackathon_id}")
async def team_schedule_check(
    team_id: UUID,
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Only the owner and accepted members can view the report.
    team = await get_team(
        db,
        team_id,
        current_user.id,
    )

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found or access denied",
        )

    report = await check_team_schedule_conflicts(
        db=db,
        team_id=team_id,
        hackathon_id=hackathon_id,
    )

    if report.get("error") == "TEAM_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    if report.get("error") == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found",
        )

    return report


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
    result = await delete_team(
        db,
        team_id,
        current_user.id,
    )

    if result == "TEAM_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    if result == "NOT_TEAM_OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team owner can delete this team",
        )

    if result == "TEAM_REGISTERED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This team cannot be deleted because it is assigned "
                "to a hackathon or has participant records"
            ),
        )

    if result != "SUCCESS":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete team",
        )

    return {
        "message": "Team deleted successfully",
    }
