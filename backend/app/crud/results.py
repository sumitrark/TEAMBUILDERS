from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hackathon import Hackathon
from app.models.project import Project
from app.models.team import Team
from app.models.submission import Submission
from app.crud.evaluation import get_project_score


async def get_published_results(
    db: AsyncSession,
    hackathon_id: UUID,
):
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    announcement_at = hackathon.results_announcement_at

    if announcement_at is None:
        return "RESULTS_NOT_PUBLISHED"

    now = datetime.now(timezone.utc)

    if announcement_at > now:
        return "RESULTS_NOT_PUBLISHED"

    projects_result = await db.execute(
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

    projects = projects_result.scalars().all()

    leaderboard = []

    for project in projects:
        score = await get_project_score(
            db=db,
            project_id=project.id,
        )

        leaderboard.append(
            {
                "project_id": project.id,
                "project_title": project.title,
                "team_id": project.team_id,
                "score": score["official_score"],
                "evaluation_count": score["evaluation_count"],
            }
        )

    leaderboard.sort(
        key=lambda item: (
            -item["score"],
            -item["evaluation_count"],
            str(item["project_id"]),
        )
    )

    for index, item in enumerate(leaderboard, start=1):
        item["rank"] = index

    return {
        "hackathon_id": hackathon.id,
        "hackathon_title": hackathon.title,
        "announced_at": announcement_at,
        "leaderboard": leaderboard,
        "top_three": leaderboard[:3],
    }