from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evaluation import Evaluation
from app.models.evaluation_criterion import EvaluationCriterion
from app.models.project import Project
from app.models.team import Team
from app.models.judge import Judge
from app.schemas.evaluation import EvaluationCreate


async def _get_active_criteria(
    db: AsyncSession,
    hackathon_id: UUID,
):
    result = await db.execute(
        select(EvaluationCriterion)
        .where(
            EvaluationCriterion.hackathon_id == hackathon_id,
            EvaluationCriterion.is_active.is_(True),
        )
        .order_by(
            EvaluationCriterion.display_order.asc(),
            EvaluationCriterion.created_at.asc(),
        )
    )

    return result.scalars().all()


def _calculate_weighted_score(
    criteria,
    criterion_scores: dict[str, int],
) -> float | None:
    if not criteria:
        return None

    total_weight = sum(c.weight for c in criteria)

    if total_weight <= 0:
        return None

    weighted_score = 0.0

    for criterion in criteria:
        score = criterion_scores[str(criterion.id)]
        percentage = score / criterion.max_score
        weighted_score += percentage * criterion.weight

    return round(weighted_score, 2)


async def create_evaluation(
    db: AsyncSession,
    user_id: UUID,
    data: EvaluationCreate,
):
    # --------------------------------------------------------
    # Find the project first so authorization is scoped to the
    # exact hackathon containing that project.
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

    # --------------------------------------------------------
    # Judge authorization is scoped to this hackathon.
    # --------------------------------------------------------

    judge_result = await db.execute(
        select(Judge).where(
            Judge.user_id == user_id,
            Judge.hackathon_id == team.hackathon_id,
            Judge.status.in_(["active", "accepted"]),
        )
    )

    judge = judge_result.scalar_one_or_none()

    if judge is None:
        return "NOT_A_JUDGE"

    # --------------------------------------------------------
    # Judges cannot evaluate their own team.
    # --------------------------------------------------------

    from app.models.team_member import TeamMember

    member_result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team.id,
            TeamMember.user_id == user_id,
        )
    )

    if member_result.scalar_one_or_none():
        return "SELF_EVALUATION_NOT_ALLOWED"

    # --------------------------------------------------------
    # One evaluation per judge/project.
    # --------------------------------------------------------

    existing_result = await db.execute(
        select(Evaluation).where(
            Evaluation.project_id == data.project_id,
            Evaluation.judge_id == user_id,
        )
    )

    if existing_result.scalar_one_or_none():
        return "ALREADY_EVALUATED"

    # --------------------------------------------------------
    # Validate configurable criteria.
    #
    # Existing hackathons with no configured criteria continue
    # using the legacy five score fields.
    # --------------------------------------------------------

    criteria = await _get_active_criteria(
        db,
        team.hackathon_id,
    )

    criterion_scores = data.criterion_scores or {}

    if criteria:
        required_keys = {str(c.id) for c in criteria}
        submitted_keys = set(criterion_scores.keys())

        if required_keys != submitted_keys:
            return "INVALID_CRITERION_SCORES"

        for criterion in criteria:
            score = criterion_scores.get(str(criterion.id))

            if not isinstance(score, int):
                return "INVALID_CRITERION_SCORES"

            if score < 0 or score > criterion.max_score:
                return "CRITERION_SCORE_OUT_OF_RANGE"

        total_weight = sum(c.weight for c in criteria)

        if total_weight <= 0:
            return "INVALID_CRITERIA_WEIGHTS"

    elif criterion_scores:
        # Do not accept arbitrary criterion IDs for a hackathon
        # that has no configured criteria.
        return "INVALID_CRITERION_SCORES"

    # --------------------------------------------------------
    # Persist both legacy scores and configurable scores.
    # --------------------------------------------------------

    evaluation = Evaluation(
        project_id=data.project_id,
        judge_id=user_id,
        innovation_score=data.innovation_score,
        technical_score=data.technical_score,
        impact_score=data.impact_score,
        presentation_score=data.presentation_score,
        overall_score=data.overall_score,
        criterion_scores=criterion_scores or None,
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
            "weighted_score": None,
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

    # --------------------------------------------------------
    # If configurable criteria exist, calculate the average
    # normalized weighted score across submitted evaluations.
    # --------------------------------------------------------

    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id
        )
    )

    project = project_result.scalar_one_or_none()

    weighted_score = None

    if project is not None and project.hackathon_id is not None:
        criteria = await _get_active_criteria(
            db,
            project.hackathon_id,
        )

        if criteria and all(
            evaluation.criterion_scores
            for evaluation in (
                await db.execute(
                    select(Evaluation).where(
                        Evaluation.project_id == project_id
                    )
                )
            ).scalars().all()
        ):
            scores_result = await db.execute(
                select(Evaluation).where(
                    Evaluation.project_id == project_id
                )
            )

            evaluations = scores_result.scalars().all()

            calculated_scores = []

            for evaluation in evaluations:
                if not evaluation.criterion_scores:
                    continue

                try:
                    score = _calculate_weighted_score(
                        criteria,
                        evaluation.criterion_scores,
                    )
                except (KeyError, TypeError, ZeroDivisionError):
                    score = None

                if score is not None:
                    calculated_scores.append(score)

            if calculated_scores:
                weighted_score = round(
                    sum(calculated_scores) / len(calculated_scores),
                    2,
                )

    return {
        "evaluation_count": count,
        "average_score": average_score,
        "total_score": round(
            average_score * 10,
            2,
        ),
        "weighted_score": weighted_score,
    }
