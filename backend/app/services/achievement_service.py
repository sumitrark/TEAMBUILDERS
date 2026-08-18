from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.achievement import Achievement


# =========================================================
# ACHIEVEMENT DEFINITIONS
# =========================================================

ACHIEVEMENTS = {
    "FIRST_HACKATHON": {
        "title": "First Hackathon",
        "description": "Joined your first hackathon.",
        "icon": "trophy",
    },
    "TEAM_BUILDER": {
        "title": "Team Builder",
        "description": "Created your first team.",
        "icon": "users",
    },
    "COLLABORATOR": {
        "title": "Collaborator",
        "description": "Joined a team and started collaborating.",
        "icon": "handshake",
    },
    "PROJECT_CREATOR": {
        "title": "Project Creator",
        "description": "Created your first project.",
        "icon": "folder",
    },
    "AI_EXPLORER": {
        "title": "AI Explorer",
        "description": "Used AI Matchmaker.",
        "icon": "sparkles",
    },
    "CONTENT_CREATOR": {
        "title": "Content Creator",
        "description": "Generated content using AI Content Studio.",
        "icon": "pen",
    },
    "HELP_SEEKER": {
        "title": "Help Seeker",
        "description": "Used the TEAMBUILDERS Help Center.",
        "icon": "help-circle",
    },
}


# =========================================================
# AWARD ACHIEVEMENT
# =========================================================

async def award_achievement(
    db: AsyncSession,
    user_id: UUID,
    code: str,
):
    definition = ACHIEVEMENTS.get(code)

    if definition is None:
        return None

    result = await db.execute(
        select(Achievement).where(
            Achievement.user_id == user_id,
            Achievement.code == code,
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        return existing

    achievement = Achievement(
        user_id=user_id,
        code=code,
        title=definition["title"],
        description=definition["description"],
        icon=definition["icon"],
    )

    db.add(achievement)

    await db.commit()
    await db.refresh(achievement)

    return achievement


# =========================================================
# GET USER ACHIEVEMENTS
# =========================================================

async def get_user_achievements(
    db: AsyncSession,
    user_id: UUID,
):
    result = await db.execute(
        select(Achievement)
        .where(
            Achievement.user_id == user_id
        )
        .order_by(
            Achievement.earned_at.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# CHECK ACHIEVEMENT
# =========================================================

async def has_achievement(
    db: AsyncSession,
    user_id: UUID,
    code: str,
):
    result = await db.execute(
        select(Achievement).where(
            Achievement.user_id == user_id,
            Achievement.code == code,
        )
    )

    return result.scalar_one_or_none() is not None