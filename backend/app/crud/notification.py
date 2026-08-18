from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    notification_type: str,
    title: str,
    message: str,
    action_url: str | None = None,
):
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        action_url=action_url,
        is_read=False,
    )

    db.add(notification)

    await db.commit()
    await db.refresh(notification)

    return notification


async def get_my_notifications(
    db: AsyncSession,
    user_id: UUID,
):
    result = await db.execute(
        select(Notification)
        .where(
            Notification.user_id == user_id
        )
        .order_by(
            Notification.created_at.desc()
        )
    )

    return result.scalars().all()


async def get_unread_count(
    db: AsyncSession,
    user_id: UUID,
):
    from sqlalchemy import func

    result = await db.scalar(
        select(func.count(Notification.id))
        .where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
    )

    return result or 0


async def mark_as_read(
    db: AsyncSession,
    notification_id: UUID,
    user_id: UUID,
):
    result = await db.execute(
        select(Notification)
        .where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )

    notification = result.scalar_one_or_none()

    if notification is None:
        return None

    notification.is_read = True

    await db.commit()
    await db.refresh(notification)

    return notification


async def mark_all_as_read(
    db: AsyncSession,
    user_id: UUID,
):
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True)
    )

    await db.commit()