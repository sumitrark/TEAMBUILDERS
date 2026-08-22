from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.student import get_current_student

from app.schemas.matchmaker import MatchmakerResponse

from app.services.matchmaker_service import (
    get_recommendations,
)


router = APIRouter(
    prefix="/matchmaker",
    tags=["AI Matchmaker"],
)


@router.get(
    "/recommendations",
    response_model=MatchmakerResponse,
)
async def recommendations(
    limit: int = Query(
        default=10,
        ge=1,
        le=50,
    ),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_student),
):
    results = await get_recommendations(
        db=db,
        current_user=current_user,
        limit=limit,
    )

    return {
        "recommendations": results,
    }