from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content_generation import ContentGeneration


async def create_content_generation(
    db: AsyncSession,
    user_id: UUID,
    project_id: UUID | None,
    platform: str,
    content_type: str,
    tone: str,
    prompt: str | None,
    generated_content: str,
) -> ContentGeneration:

    content = ContentGeneration(
        user_id=user_id,
        project_id=project_id,
        platform=platform,
        content_type=content_type,
        tone=tone,
        prompt=prompt,
        generated_content=generated_content,
        status="generated",
    )

    db.add(content)

    await db.commit()

    await db.refresh(content)

    return content


async def get_user_content_generations(
    db: AsyncSession,
    user_id: UUID,
):
    result = await db.execute(
        select(ContentGeneration)
        .where(
            ContentGeneration.user_id == user_id
        )
        .order_by(
            ContentGeneration.created_at.desc()
        )
    )

    return result.scalars().all()