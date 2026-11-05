from uuid import UUID
from app.models.team_member import TeamMember
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evaluation import Evaluation
from app.models.evaluation_criterion import EvaluationCriterion
from app.models.project import Project
from app.models.team import Team
from app.models.judge import Judge
from app.schemas.evaluation import EvaluationCreate
from app.models.judge_project_assignment import JudgeProjectAssignment

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
# Judge can only evaluate projects explicitly assigned to them.
# --------------------------------------------------------

    assignment_result = await db.execute(
    select(JudgeProjectAssignment).where(
        JudgeProjectAssignment.judge_id == judge.id,
        JudgeProjectAssignment.project_id == data.project_id,
    )
)

    if assignment_result.scalar_one_or_none() is None:
      return "PROJECT_NOT_ASSIGNED"

# --------------------------------------------------------
# Judges cannot evaluate their own team.
# --------------------------------------------------------

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
    evaluations_result = await db.execute(
        select(Evaluation)
        .where(Evaluation.project_id == project_id)
        .order_by(Evaluation.created_at.asc())
    )
    evaluations = evaluations_result.scalars().all()

    if not evaluations:
        return {
            "evaluation_count": 0,
            "average_score": 0,
            "total_score": 0,
            "weighted_score": None,
            "official_score": 0,
        }

    project_result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project_result.scalar_one_or_none()

    if project is None:
        return {
            "evaluation_count": len(evaluations),
            "average_score": 0,
            "total_score": 0,
            "weighted_score": None,
            "official_score": 0,
        }

    criteria = []

    if project.team_id is not None:
        team_result = await db.execute(
            select(Team).where(Team.id == project.team_id)
        )
        team = team_result.scalar_one_or_none()

        if team is not None and team.hackathon_id is not None:
            criteria = await _get_active_criteria(
                db,
                team.hackathon_id,
            )

    if criteria:
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

        official_score = (
            round(sum(calculated_scores) / len(calculated_scores), 2)
            if calculated_scores
            else 0
        )
        weighted_score = official_score

    else:
        legacy_scores = []

        for evaluation in evaluations:
            score_sum = (
                evaluation.innovation_score
                + evaluation.technical_score
                + evaluation.impact_score
                + evaluation.presentation_score
                + evaluation.overall_score
            )
            legacy_scores.append((score_sum / 50) * 100)

        official_score = round(
            sum(legacy_scores) / len(legacy_scores), 2
        )
        weighted_score = None

    average_score = round(
        sum(
            evaluation.innovation_score
            + evaluation.technical_score
            + evaluation.impact_score
            + evaluation.presentation_score
            + evaluation.overall_score
            for evaluation in evaluations
        ) / len(evaluations),
        2,
    )

    return {
        "evaluation_count": len(evaluations),
        "average_score": average_score,
        "total_score": official_score,
        "weighted_score": weighted_score,
        "official_score": official_score,
    }



async def get_my_evaluation_for_project(
    db: AsyncSession,
    judge_id: UUID,
    project_id: UUID,
):
    """Return the current judge's evaluation for a specific project, or None."""
    result = await db.execute(
        select(Evaluation).where(
            Evaluation.project_id == project_id,
            Evaluation.judge_id == judge_id,
        )
    )
    return result.scalar_one_or_none()


async def update_evaluation(
    db: AsyncSession,
    evaluation_id: UUID,
    judge_id: UUID,
    data: "EvaluationCreate",  # noqa: F821 — forward ref, imported at call site
):
    """Allow a judge to update their own evaluation before it is submitted."""
    result = await db.execute(
        select(Evaluation).where(
            Evaluation.id == evaluation_id,
            Evaluation.judge_id == judge_id,
        )
    )
    evaluation = result.scalar_one_or_none()

    if evaluation is None:
        return "NOT_FOUND"

    # Update legacy score fields when provided.
    for field in (
        "innovation_score",
        "technical_score",
        "impact_score",
        "presentation_score",
        "overall_score",
        "feedback",
    ):
        value = getattr(data, field, None)
        if value is not None:
            setattr(evaluation, field, value)

    if data.criterion_scores is not None:
        evaluation.criterion_scores = data.criterion_scores

    await db.commit()
    await db.refresh(evaluation)

    return evaluation
