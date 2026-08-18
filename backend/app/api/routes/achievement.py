from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

from app.dependencies.current_user import (
    get_current_user,
)

from app.schemas.achievement import (
    AchievementResponse,
)

from app.services.achievement_service import (
    get_user_achievements,
)


router = APIRouter(
    prefix="/achievements",
    tags=["Achievements"],
)


@router.get(
    "",
    response_model=list[AchievementResponse],
)
async def get_achievements(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_user_achievements(
        db=db,
        user_id=current_user.id,
    )