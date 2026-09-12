from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evaluation import Evaluation
from app.models.project import Project
from app.models.team import Team
from app.models.judge import Judge
from app.models.hackathon import Hackathon
from app.schemas.evaluation import EvaluationCreate


async def create_evaluation(
    db: AsyncSession,
    user_id: UUID,
    data: EvaluationCreate,
):
    # --------------------------------------------------------
    # Look up the project/team FIRST so we know which hackathon
    # this evaluation is actually for, then check for an active
    # Judge row scoped to that exact hackathon.
    #
    # The previous version queried Judge by user_id alone (no
    # hackathon filter) and called .scalar_one_or_none() - for any
    # judge active across more than one hackathon (an explicitly
    # supported scenario), that raises MultipleResultsFound and the
    # evaluation crashes instead of being correctly authorized or
    # rejected.
    # --------------------------------------------------------

    project_result = await db.execute(
        select(Project).where(
            Project.id == data.project_id
        )
    )

    project = project_result.scalar_one_or_none()

    if project is None:
        return "PROJECT_NOT_FOUND"

    if project.team_id is None:
        return "PROJECT_HAS_NO_TEAM"

    team_result = await db.execute(
        select(Team).where(
            Team.id == project.team_id
        )
    )

    team = team_result.scalar_one_or_none()

    if team is None:
        return "TEAM_NOT_FOUND"

    judge_result = await db.execute(
        select(Judge).where(
            Judge.user_id == user_id,
            Judge.hackathon_id == team.hackathon_id,
            Judge.status.in_(
                ["active", "accepted"]
            ),
        )
    )

    judge = judge_result.scalar_one_or_none()

    if judge is None:
        return "NOT_A_JUDGE"

    from app.models.team_member import TeamMember

    member_result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team.id,
            TeamMember.user_id == user_id,
        )
    )

    if member_result.scalar_one_or_none():
        return "SELF_EVALUATION_NOT_ALLOWED"

    existing_result = await db.execute(
        select(Evaluation).where(
            Evaluation.project_id == data.project_id,
            Evaluation.judge_id == user_id,
        )
    )

    if existing_result.scalar_one_or_none():
        return "ALREADY_EVALUATED"

    evaluation = Evaluation(
        project_id=data.project_id,
        judge_id=user_id,
        innovation_score=data.innovation_score,
        technical_score=data.technical_score,
        impact_score=data.impact_score,
        presentation_score=data.presentation_score,
        overall_score=data.overall_score,
        feedback=data.feedback,
    )

    db.add(evaluation)

    await db.commit()
    await db.refresh(evaluation)

    return evaluation


async def get_my_evaluations(
    db: AsyncSession,
    judge_id: UUID,
):
    result = await db.execute(
        select(Evaluation)
        .where(
            Evaluation.judge_id == judge_id
        )
        .order_by(
            Evaluation.created_at.desc()
        )
    )

    return result.scalars().all()


async def get_project_evaluations(
    db: AsyncSession,
    project_id: UUID,
):
    result = await db.execute(
        select(Evaluation)
        .where(
            Evaluation.project_id == project_id
        )
        .order_by(
            Evaluation.created_at.desc()
        )
    )

    return result.scalars().all()


async def get_project_score(
    db: AsyncSession,
    project_id: UUID,
):
    result = await db.execute(
        select(
            func.count(Evaluation.id),
            func.avg(Evaluation.innovation_score),
            func.avg(Evaluation.technical_score),
            func.avg(Evaluation.impact_score),
            func.avg(Evaluation.presentation_score),
            func.avg(Evaluation.overall_score),
        )
        .where(
            Evaluation.project_id == project_id
        )
    )

    row = result.one()

    count = row[0]

    if count == 0:
        return {
            "evaluation_count": 0,
            "average_score": 0,
            "total_score": 0,
        }

    average_score = (
        float(row[1] or 0)
        + float(row[2] or 0)
        + float(row[3] or 0)
        + float(row[4] or 0)
        + float(row[5] or 0)
    )

    average_score = round(
        average_score,
        2,
    )

    return {
        "evaluation_count": count,
        "average_score": average_score,
        "total_score": round(
            average_score * 10,
            2,
        ),
    }