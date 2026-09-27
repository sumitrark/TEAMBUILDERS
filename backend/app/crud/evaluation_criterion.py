from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evaluation import Evaluation
from app.models.evaluation_criterion import EvaluationCriterion
from app.models.hackathon import Hackathon
from app.models.project import Project
from app.schemas.evaluation_criterion import (
    EvaluationCriterionCreate,
    EvaluationCriterionUpdate,
)
from app.services.hackathon_lifecycle import get_hackathon_status


async def get_hackathon_criteria(
    db: AsyncSession,
    hackathon_id: UUID,
    active_only: bool = False,
):
    query = (
        select(EvaluationCriterion)
        .where(EvaluationCriterion.hackathon_id == hackathon_id)
        .order_by(
            EvaluationCriterion.display_order.asc(),
            EvaluationCriterion.created_at.asc(),
        )
    )

    if active_only:
        query = query.where(EvaluationCriterion.is_active.is_(True))

    result = await db.execute(query)
    return result.scalars().all()


async def get_evaluation_criterion(
    db: AsyncSession,
    criterion_id: UUID,
):
    result = await db.execute(
        select(EvaluationCriterion).where(
            EvaluationCriterion.id == criterion_id
        )
    )
    return result.scalar_one_or_none()


async def get_hackathon_for_organizer(
    db: AsyncSession,
    hackathon_id: UUID,
    organizer_id: UUID,
):
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )
    return result.scalar_one_or_none()


async def get_total_active_weight(
    db: AsyncSession,
    hackathon_id: UUID,
):
    result = await db.execute(
        select(EvaluationCriterion.weight).where(
            EvaluationCriterion.hackathon_id == hackathon_id,
            EvaluationCriterion.is_active.is_(True),
        )
    )

    return sum(result.scalars().all())


async def has_started_evaluation(
    db: AsyncSession,
    hackathon_id: UUID,
):
    result = await db.execute(
        select(Evaluation.id)
        .join(Project, Evaluation.project_id == Project.id)
        .where(Project.hackathon_id == hackathon_id)
        .limit(1)
    )

    return result.scalar_one_or_none() is not None


async def _criteria_are_locked(
    db: AsyncSession,
    hackathon: Hackathon,
):
    lifecycle_status = get_hackathon_status(hackathon)

    if lifecycle_status in {"LIVE", "COMPLETED"}:
        return True

    if await has_started_evaluation(db, hackathon.id):
        return True

    return False


async def create_evaluation_criterion(
    db: AsyncSession,
    hackathon_id: UUID,
    organizer_id: UUID,
    data: EvaluationCriterionCreate,
):
    hackathon = await get_hackathon_for_organizer(
        db,
        hackathon_id,
        organizer_id,
    )

    if hackathon is None:
        return "NOT_AUTHORIZED"

    if await _criteria_are_locked(db, hackathon):
        return "CRITERIA_LOCKED"

    existing = await db.execute(
        select(EvaluationCriterion).where(
            EvaluationCriterion.hackathon_id == hackathon_id,
            EvaluationCriterion.key == data.key,
        )
    )

    if existing.scalar_one_or_none() is not None:
        return "DUPLICATE_KEY"

    criterion = EvaluationCriterion(
        hackathon_id=hackathon_id,
        key=data.key,
        name=data.name,
        description=data.description,
        max_score=data.max_score,
        weight=data.weight,
        display_order=data.display_order,
        is_active=data.is_active,
    )

    db.add(criterion)
    await db.commit()
    await db.refresh(criterion)

    return criterion


async def update_evaluation_criterion(
    db: AsyncSession,
    criterion_id: UUID,
    organizer_id: UUID,
    data: EvaluationCriterionUpdate,
):
    criterion = await get_evaluation_criterion(db, criterion_id)

    if criterion is None:
        return "NOT_FOUND"

    hackathon = await get_hackathon_for_organizer(
        db,
        criterion.hackathon_id,
        organizer_id,
    )

    if hackathon is None:
        return "NOT_AUTHORIZED"

    if await _criteria_are_locked(db, hackathon):
        return "CRITERIA_LOCKED"

    if data.key is not None and data.key != criterion.key:
        duplicate = await db.execute(
            select(EvaluationCriterion).where(
                EvaluationCriterion.hackathon_id == criterion.hackathon_id,
                EvaluationCriterion.key == data.key,
                EvaluationCriterion.id != criterion.id,
            )
        )

        if duplicate.scalar_one_or_none() is not None:
            return "DUPLICATE_KEY"

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(criterion, field, value)

    await db.commit()
    await db.refresh(criterion)

    return criterion


async def delete_evaluation_criterion(
    db: AsyncSession,
    criterion_id: UUID,
    organizer_id: UUID,
):
    criterion = await get_evaluation_criterion(db, criterion_id)

    if criterion is None:
        return "NOT_FOUND"

    hackathon = await get_hackathon_for_organizer(
        db,
        criterion.hackathon_id,
        organizer_id,
    )

    if hackathon is None:
        return "NOT_AUTHORIZED"

    if await _criteria_are_locked(db, hackathon):
        return "CRITERIA_LOCKED"

    criterion.is_active = False

    await db.commit()
    await db.refresh(criterion)

    return criterion
