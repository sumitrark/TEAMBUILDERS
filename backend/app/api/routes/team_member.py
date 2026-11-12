
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user

from app.crud.team_member import (
    get_team_members,
    add_team_member,
    remove_team_member,
)
from app.crud.team import get_team

from app.models.team import Team

from app.schemas.team_member import TeamMemberResponse


router = APIRouter(
    prefix="/team-members",
    tags=["Team Members"],
)


# =========================================================
# VIEW TEAM MEMBERS
# Owner and accepted members can view the roster.
# =========================================================

@router.get(
    "/{team_id}",
    response_model=list[TeamMemberResponse],
)
async def team_members(
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
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team",
        )

    return await get_team_members(
        db,
        team_id,
    )


# =========================================================
# ADD MEMBER
# Owner only.
# =========================================================

@router.post(
    "/{team_id}/{user_id}",
    response_model=TeamMemberResponse,
)
async def add_member(
    team_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.owner_id == current_user.id,
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team owner can add members",
        )

    result = await add_team_member(
        db=db,
        team_id=team_id,
        user_id=user_id,
    )

    if result == "TEAM_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    if result == "ALREADY_MEMBER":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a team member",
        )

    if result == "TEAM_FULL":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team has reached its maximum members",
        )

    return result


# =========================================================
# REMOVE MEMBER
# Owner only.
# =========================================================

@router.delete(
    "/{team_id}/{user_id}",
)
async def remove_member(
    team_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.owner_id == current_user.id,
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team owner can remove members",
        )

    removed = await remove_team_member(
        db,
        team_id,
        user_id,
    )

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found",
        )

    return {
        "message": "Team member removed successfully",
    }
