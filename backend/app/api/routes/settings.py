from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user

from app.schemas.settings import (
    SettingsResponse,
    SettingsUpdate,
)

from app.crud.settings import (
    get_settings,
    update_settings,
)


router = APIRouter(
    prefix="/settings",
    tags=["Settings"],
)


@router.get(
    "",
    response_model=SettingsResponse,
)
async def read_settings(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_settings(
        db,
        current_user.id,
    )


@router.put(
    "",
    response_model=SettingsResponse,
)
async def save_settings(
    data: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await update_settings(
        db,
        current_user.id,
        data,
    )