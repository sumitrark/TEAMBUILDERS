from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings

from app.crud.content_generation import (
    create_content_generation,
    count_user_content_generations_today,
)
from app.crud.project import get_project_by_id

from app.services.achievement_service import (
    award_achievement,
)
from app.services.ai_client import (
    AIServiceError,
    AIServiceNotConfiguredError,
    generate_text,
)
from app.services.github_context import fetch_github_readme


# =========================================================
# PROMPT BUILDING
# =========================================================

def _build_prompt(
    platform: str,
    content_type: str,
    tone: str,
    prompt: str | None,
    project_context: str | None,
    github_readme: str | None,
) -> tuple[str, str]:

    system_prompt = (
        "You are the AI Content Studio for TeamBuilders AI, a "
        "hackathon platform. You write polished, specific, non-generic "
        "content for students and organizers to share their real "
        "hackathon projects. Ground everything in the actual project "
        "details provided - never invent features, technologies, or "
        "results that weren't mentioned. Do not use placeholder "
        "brackets like [Project Name]. Write only the final content, "
        "with no preamble, meta-commentary, or explanation of what "
        "you did."
    )

    parts = [
        f"Platform: {platform}",
        f"Content type: {content_type}",
        f"Tone: {tone}",
    ]

    if project_context:
        parts.append(f"\nProject details:\n{project_context}")

    if github_readme:
        parts.append(
            f"\nRelevant excerpt from the project's GitHub README "
            f"(use this for real technical detail, don't just repeat "
            f"it verbatim):\n{github_readme}"
        )

    if prompt:
        parts.append(f"\nSpecific instructions from the user:\n{prompt}")

    user_prompt = "\n".join(parts)

    return system_prompt, user_prompt


def _project_context_text(project) -> str:
    lines = [f"Title: {project.title}"]

    if project.description:
        lines.append(f"Description: {project.description}")

    if project.tech_stack:
        lines.append(f"Technology stack: {project.tech_stack}")

    if project.demo_url:
        lines.append(f"Demo: {project.demo_url}")

    return "\n".join(lines)


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
    # Cost control: per-user daily generation limit
    # -----------------------------------------------------

    generations_today = await count_user_content_generations_today(
        db, user_id
    )

    if generations_today >= settings.AI_DAILY_CONTENT_LIMIT:
        raise ValueError(
            f"You've reached today's AI content generation limit "
            f"({settings.AI_DAILY_CONTENT_LIMIT}). Please try again "
            f"tomorrow."
        )

    # -----------------------------------------------------
    # Gather grounding context
    # -----------------------------------------------------

    project_context = None
    github_readme = None

    if project_id:
        project = await get_project_by_id(db, project_id)

        if project:
            project_context = _project_context_text(project)

            if project.github_url:
                github_readme = await fetch_github_readme(
                    project.github_url
                )

    # -----------------------------------------------------
    # Generate content via LLM
    # -----------------------------------------------------

    system_prompt, user_prompt = _build_prompt(
        platform=platform,
        content_type=content_type,
        tone=tone,
        prompt=prompt,
        project_context=project_context,
        github_readme=github_readme,
    )

    try:
        generated_content = await generate_text(system_prompt, user_prompt)

    except AIServiceNotConfiguredError as exc:
        raise ValueError(str(exc)) from exc

    except AIServiceError as exc:
        raise ValueError(str(exc)) from exc

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
