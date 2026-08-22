from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.judge import Judge
from app.models.project import Project
from app.models.team import Team


# ============================================================
# GET JUDGE PROJECTS
# ============================================================

async def get_judge_projects(
    db: AsyncSession,
    judge_id: UUID,
    hackathon_id: UUID,
):
    # --------------------------------------------------------
    # Verify judge belongs to this hackathon
    # --------------------------------------------------------

    judge_result = await db.execute(
        select(Judge).where(
            Judge.user_id == judge_id,
            Judge.hackathon_id == hackathon_id,
            Judge.status.in_(["active", "accepted"]),
        )
    )

    judge = judge_result.scalar_one_or_none()

    if judge is None:
        return "NOT_ACTIVE_JUDGE"

    # --------------------------------------------------------
    # Get projects belonging to teams in this hackathon
    # --------------------------------------------------------

    result = await db.execute(
        select(Project)
        .join(
            Team,
            Project.team_id == Team.id,
        )
        .where(
            Team.hackathon_id == hackathon_id
        )
        .order_by(
            Project.created_at.desc()
        )
    )

    return result.scalars().all()


# ============================================================
# GET JUDGE STATUS
# ============================================================

async def get_judge_status(
    db: AsyncSession,
    judge_id: UUID,
    hackathon_id: UUID,
):
    result = await db.execute(
        select(Judge).where(
            Judge.user_id == judge_id,
            Judge.hackathon_id == hackathon_id,
        )
    )

    return result.scalar_one_or_none()