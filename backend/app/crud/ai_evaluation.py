from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_evaluation import AiEvaluation


async def get_ai_evaluation_by_project(
    db: AsyncSession,
    project_id: UUID,
) -> AiEvaluation | None:
    result = await db.execute(
        select(AiEvaluation).where(AiEvaluation.project_id == project_id)
    )

    return result.scalar_one_or_none()


async def upsert_ai_evaluation(
    db: AsyncSession,
    *,
    project_id: UUID,
    requested_by_user_id: UUID,
    innovation_score: int,
    technical_score: int,
    impact_score: int,
    feasibility_score: int,
    overall_score: int,
    ui_ux_notes: str | None,
    strengths: list[str],
    weaknesses: list[str],
    suggestions: list[str],
    potential_issues: list[str],
    model_name: str,
) -> AiEvaluation:
    record = await get_ai_evaluation_by_project(db, project_id)

    if record is None:
        record = AiEvaluation(project_id=project_id)
        db.add(record)

    record.requested_by_user_id = requested_by_user_id
    record.innovation_score = innovation_score
    record.technical_score = technical_score
    record.impact_score = impact_score
    record.feasibility_score = feasibility_score
    record.overall_score = overall_score
    record.ui_ux_notes = ui_ux_notes
    record.strengths = strengths
    record.weaknesses = weaknesses
    record.suggestions = suggestions
    record.potential_issues = potential_issues
    record.model_name = model_name

    await db.commit()
    await db.refresh(record)

    return record


async def count_user_ai_evaluations_today(
    db: AsyncSession,
    user_id: UUID,
) -> int:
    start_of_day = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    result = await db.execute(
        select(func.count()).select_from(AiEvaluation).where(
            AiEvaluation.requested_by_user_id == user_id,
            AiEvaluation.updated_at >= start_of_day,
        )
    )

    return result.scalar_one()
