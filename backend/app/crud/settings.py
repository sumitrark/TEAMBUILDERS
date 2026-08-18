from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_settings import UserSettings
from app.schemas.settings import SettingsUpdate


async def get_settings(
    db: AsyncSession,
    user_id: UUID,
):
    result = await db.execute(
        select(UserSettings).where(
            UserSettings.user_id == user_id
        )
    )

    settings = result.scalar_one_or_none()

    if settings is None:
        settings = UserSettings(
            user_id=user_id,
            team_invitations=True,
            hackathon_reminders=True,
            ai_recommendations=True,
            profile_visibility="public",
        )

        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


async def update_settings(
    db: AsyncSession,
    user_id: UUID,
    data: SettingsUpdate,
):
    settings = await get_settings(db, user_id)

    settings.team_invitations = data.team_invitations
    settings.hackathon_reminders = data.hackathon_reminders
    settings.ai_recommendations = data.ai_recommendations
    settings.profile_visibility = data.profile_visibility

    await db.commit()
    await db.refresh(settings)

    return settings