from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings

from app.crud.ai_evaluation import (
    count_user_ai_evaluations_today,
    upsert_ai_evaluation,
)
from app.crud.project import get_project_by_id

from app.services.ai_client import (
    AIServiceError,
    AIServiceNotConfiguredError,
    generate_json,
)
from app.services.github_context import fetch_github_readme

SYSTEM_PROMPT = (
    "You are an AI assistant helping hackathon judges evaluate student "
    "projects. Your evaluation is ADVISORY ONLY - it assists a human "
    "judge and never replaces their judgment or their score. Be honest "
    "and specific, grounded only in the project information given to "
    "you; never invent features, metrics, or outcomes that weren't "
    "mentioned. If information is missing (e.g. no README, no demo "
    "link), say so plainly rather than guessing.\n\n"
    "Respond with a single JSON object with exactly these keys:\n"
    '- "innovation_score": integer 0-25\n'
    '- "technical_score": integer 0-25\n'
    '- "impact_score": integer 0-25\n'
    '- "feasibility_score": integer 0-25\n'
    '- "overall_score": integer 0-100, your holistic judgment '
    "(does not need to equal the sum of the above)\n"
    '- "ui_ux_notes": a short string of observations, or an empty '
    "string if there's nothing to see (e.g. no demo/screenshots)\n"
    '- "strengths": array of short strings\n'
    '- "weaknesses": array of short strings\n'
    '- "suggestions": array of short, actionable strings\n'
    '- "potential_issues": array of short strings (e.g. missing '
    "tests, no deployment evidence, unclear licensing) - empty "
    "array if none stand out"
)


def _project_context_text(project, github_readme: str | None) -> str:
    lines = [f"Title: {project.title}"]

    if project.description:
        lines.append(f"Description: {project.description}")
    else:
        lines.append("Description: (none provided)")

    if project.tech_stack:
        lines.append(f"Technology stack: {project.tech_stack}")
    else:
        lines.append("Technology stack: (none provided)")

    lines.append(
        f"Demo URL: {project.demo_url}" if project.demo_url
        else "Demo URL: (none provided)"
    )
    lines.append(
        f"GitHub URL: {project.github_url}" if project.github_url
        else "GitHub URL: (none provided)"
    )

    if github_readme:
        lines.append(f"\nREADME excerpt:\n{github_readme}")
    elif project.github_url:
        lines.append(
            "\n(README could not be retrieved - repo may be private, "
            "renamed, or have no README.)"
        )

    return "\n".join(lines)


def _clamp(value, low: int, high: int, default: int) -> int:
    try:
        value = int(value)
    except (TypeError, ValueError):
        return default

    return max(low, min(high, value))


def _clamp_list(value) -> list[str]:
    if not isinstance(value, list):
        return []

    return [str(item)[:300] for item in value if item][:10]


async def generate_ai_evaluation(
    db: AsyncSession,
    project_id: UUID,
    requested_by_user_id: UUID,
):
    # -----------------------------------------------------
    # Cost control: per-user daily AI evaluation limit
    # -----------------------------------------------------

    evaluations_today = await count_user_ai_evaluations_today(
        db, requested_by_user_id
    )

    if evaluations_today >= settings.AI_DAILY_EVALUATION_LIMIT:
        raise ValueError(
            f"You've reached today's AI evaluation limit "
            f"({settings.AI_DAILY_EVALUATION_LIMIT}). Please try again "
            f"tomorrow."
        )

    project = await get_project_by_id(db, project_id)

    if not project:
        raise LookupError("Project not found")

    github_readme = None

    if project.github_url:
        github_readme = await fetch_github_readme(project.github_url)

    user_prompt = _project_context_text(project, github_readme)

    try:
        result = await generate_json(SYSTEM_PROMPT, user_prompt)

    except AIServiceNotConfiguredError as exc:
        raise ValueError(str(exc)) from exc

    except AIServiceError as exc:
        raise ValueError(str(exc)) from exc

    # Defensively validate/clamp every field - never trust the model
    # to stay in range or return well-formed types.
    record = await upsert_ai_evaluation(
        db,
        project_id=project_id,
        requested_by_user_id=requested_by_user_id,
        innovation_score=_clamp(result.get("innovation_score"), 0, 25, 0),
        technical_score=_clamp(result.get("technical_score"), 0, 25, 0),
        impact_score=_clamp(result.get("impact_score"), 0, 25, 0),
        feasibility_score=_clamp(result.get("feasibility_score"), 0, 25, 0),
        overall_score=_clamp(result.get("overall_score"), 0, 100, 0),
        ui_ux_notes=(
            str(result.get("ui_ux_notes"))[:1000]
            if result.get("ui_ux_notes")
            else None
        ),
        strengths=_clamp_list(result.get("strengths")),
        weaknesses=_clamp_list(result.get("weaknesses")),
        suggestions=_clamp_list(result.get("suggestions")),
        potential_issues=_clamp_list(result.get("potential_issues")),
        model_name=settings.OPENAI_MODEL,
    )

    return record
