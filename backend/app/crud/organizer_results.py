from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evaluation import Evaluation
from app.models.hackathon import Hackathon
from app.models.judge import Judge
from app.models.judge_project_assignment import JudgeProjectAssignment
from app.models.project import Project
from app.models.submission import Submission
from app.models.team import Team
from app.crud.evaluation import get_project_score


async def get_evaluation_progress(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    # Projects with a finalized submission.
    submitted_result = await db.execute(
        select(Project)
        .join(Team, Project.team_id == Team.id)
        .join(
            Submission,
            Submission.project_id == Project.id,
        )
        .where(
            Team.hackathon_id == hackathon_id,
            Submission.status.in_(
                ["SUBMITTED", "LOCKED", "UNDER_REVIEW", "EVALUATED"]
            ),
        )
        .distinct()
    )

    submitted_projects = submitted_result.scalars().all()

    # Count distinct projects that have at least one evaluation.
    evaluated_result = await db.execute(
        select(func.count(func.distinct(Evaluation.project_id)))
        .select_from(Evaluation)
        .join(Project, Evaluation.project_id == Project.id)
        .join(Team, Project.team_id == Team.id)
        .where(
            Team.hackathon_id == hackathon_id,
        )
    )

    evaluated_count = evaluated_result.scalar() or 0
    submitted_count = len(submitted_projects)

    return {
        "hackathon_id": hackathon_id,
        "submitted_projects": submitted_count,
        "evaluated_projects": evaluated_count,
        "pending_projects": max(
            submitted_count - evaluated_count,
            0,
        ),
        "all_projects_evaluated": (
            submitted_count > 0
            and evaluated_count >= submitted_count
        ),
        "results_announcement_at": hackathon.results_announcement_at,
    }


async def schedule_results_announcement(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    announcement_at: datetime,
):
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    if announcement_at.tzinfo is None:
        return "TIMEZONE_REQUIRED"

    # --------------------------------------------------------
    # Results can only be scheduled after every submitted
    # project has at least one evaluation.
    # --------------------------------------------------------

    submitted_result = await db.execute(
        select(
            func.count(func.distinct(Project.id))
        )
        .select_from(Project)
        .join(Team, Project.team_id == Team.id)
        .join(
            Submission,
            Submission.project_id == Project.id,
        )
        .where(
            Team.hackathon_id == hackathon_id,
            Submission.status.in_(
                ["SUBMITTED", "LOCKED", "UNDER_REVIEW", "EVALUATED"]
            ),
        )
    )

    submitted_count = submitted_result.scalar() or 0

    evaluated_result = await db.execute(
        select(
            func.count(func.distinct(Evaluation.project_id))
        )
        .select_from(Evaluation)
        .join(Project, Evaluation.project_id == Project.id)
        .join(Team, Project.team_id == Team.id)
        .where(
            Team.hackathon_id == hackathon_id,
        )
    )

    evaluated_count = evaluated_result.scalar() or 0

    if submitted_count > 0 and evaluated_count < submitted_count:
        return "EVALUATIONS_INCOMPLETE"

    hackathon.results_announcement_at = announcement_at

    await db.commit()
    await db.refresh(hackathon)

    return hackathon


async def clear_results_announcement(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    hackathon.results_announcement_at = None

    await db.commit()
    await db.refresh(hackathon)

    return hackathon