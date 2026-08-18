from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.content_generation import (
    create_content_generation,
)

from app.services.achievement_service import (
    award_achievement,
)


# =========================================================
# GENERATE CONTENT
# =========================================================

def generate_content(
    platform: str,
    content_type: str,
    tone: str,
    prompt: str | None,
) -> str:

    extra = ""

    if prompt:
        extra = f"\n\n{prompt}"

    if platform.lower() == "linkedin":

        return (
            f"🚀 Excited to share our latest "
            f"{content_type}!\n\n"
            f"This project represents our team's "
            f"work, creativity, and problem-solving "
            f"in the hackathon.\n\n"
            f"Tone: {tone}."
            f"{extra}\n\n"
            f"#Hackathon #TeamBuilders #Innovation"
        )

    if platform.lower() == "twitter":

        return (
            f"🚀 We built something exciting "
            f"for our hackathon!\n\n"
            f"{content_type} | Tone: {tone}"
            f"{extra}\n\n"
            f"#Hackathon #BuildInPublic"
        )

    if platform.lower() == "instagram":

        return (
            f"🚀 Hackathon vibes!\n\n"
            f"We're excited to share our "
            f"{content_type} with you."
            f"{extra}\n\n"
            f"#Hackathon #Innovation "
            f"#TeamBuilders #Tech"
        )

    return (
        f"{content_type} generated in a "
        f"{tone} tone."
        f"{extra}"
    )


# =========================================================
# CREATE GENERATED CONTENT
# =========================================================

async def create_generated_content(
    db: AsyncSession,
    user_id: UUID,
    project_id: UUID | None,
    platform: str,
    content_type: str,
    tone: str,
    prompt: str | None,
):

    # -----------------------------------------------------
    # Generate content
    # -----------------------------------------------------

    generated_content = generate_content(
        platform=platform,
        content_type=content_type,
        tone=tone,
        prompt=prompt,
    )

    # -----------------------------------------------------
    # Save generated content
    # -----------------------------------------------------

    content = await create_content_generation(
        db=db,
        user_id=user_id,
        project_id=project_id,
        platform=platform,
        content_type=content_type,
        tone=tone,
        prompt=prompt,
        generated_content=generated_content,
    )

    # -----------------------------------------------------
    # Award CONTENT_CREATOR
    #
    # Achievement is awarded only after the content has
    # been successfully created and saved.
    # -----------------------------------------------------

    await award_achievement(
        db=db,
        user_id=user_id,
        code="CONTENT_CREATOR",
    )

    return content