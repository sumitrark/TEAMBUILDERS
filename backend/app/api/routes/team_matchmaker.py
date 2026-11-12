
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user

from app.schemas.team_matchmaker import TeamMatchmakerResponse

from app.services.team_matchmaker_service import (
    get_team_recommendations,
)


router = APIRouter(
    prefix="/teams",
    tags=["Team AI Matchmaker"],
)


@router.get(
    "/{team_id}/matchmaker/recommendations",
    response_model=TeamMatchmakerResponse,
)
async def team_matchmaker_recommendations(
    team_id: UUID,
    limit: int = Query(
        default=10,
        ge=1,
        le=50,
    ),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await get_team_recommendations(
        db=db,
        team_id=team_id,
        owner_id=current_user.id,
        limit=limit,
    )

    if result == "TEAM_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Team not found or you are not the team owner",
        )

    if result == "REQUIRED_SKILLS_NOT_SET":
        raise HTTPException(
            status_code=400,
            detail="Please select required skills before using Team AI Matchmaker",
        )

    return result
