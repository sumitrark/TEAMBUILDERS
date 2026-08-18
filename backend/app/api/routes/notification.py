from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user

from app.crud.notification import (
    get_my_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
)

from app.schemas.notification import NotificationResponse


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


@router.get(
    "",
    response_model=list[NotificationResponse],
)
async def notifications(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_my_notifications(
        db=db,
        user_id=current_user.id,
    )


@router.get("/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    count = await get_unread_count(
        db=db,
        user_id=current_user.id,
    )

    return {
        "count": count,
    }


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
async def read_notification(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notification = await mark_as_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id,
    )

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    return notification


@router.post("/read-all")
async def read_all_notifications(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await mark_all_as_read(
        db=db,
        user_id=current_user.id,
    )

    return {
        "message": "All notifications marked as read"
    }