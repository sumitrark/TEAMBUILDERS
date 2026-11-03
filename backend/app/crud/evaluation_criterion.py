
from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evaluation_criterion import EvaluationCriterion
from app.models.hackathon import Hackathon
from app.models.evaluation import Evaluation
from app.models.project import Project
from app.schemas.evaluation_criterion import (
    EvaluationCriterionCreate,
    EvaluationCriterionUpdate,
)


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


async def _criteria_are_locked(
    db: AsyncSession,
    hackathon: Hackathon,
) -> bool:
    # Lock criteria once the hackathon has started.
    if hackathon.hackathon_start is not None:
        start = hackathon.hackathon_start

        # Treat a naive timestamp as UTC.
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) >= start:
            return True

    elif hackathon.start_date <= date.today():
        return True

    # Also lock criteria once any evaluation has been submitted.
    evaluation_result = await db.execute(
        select(Evaluation.id)
        .join(Project, Evaluation.project_id == Project.id)
        .where(Project.hackathon_id == hackathon.id)
        .limit(1)
    )

    return evaluation_result.scalar_one_or_none() is not None


async def get_hackathon_criteria(
    db: AsyncSession,
    hackathon_id: UUID,
    active_only: bool = True,
):
    query = select(EvaluationCriterion).where(
        EvaluationCriterion.hackathon_id == hackathon_id
    )

    if active_only:
        query = query.where(
            EvaluationCriterion.is_active.is_(True)
        )

    query = query.order_by(
        EvaluationCriterion.display_order.asc(),
        EvaluationCriterion.created_at.asc(),
    )

    result = await db.execute(query)
    return result.scalars().all()


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

    values = data.model_dump()
    values["key"] = values["key"].strip()
    values["name"] = values["name"].strip()

    if not values["key"] or not values["name"]:
        return "INVALID_DATA"

    duplicate_result = await db.execute(
        select(EvaluationCriterion.id).where(
            EvaluationCriterion.hackathon_id == hackathon_id,
            EvaluationCriterion.key == values["key"],
        )
    )

    if duplicate_result.scalar_one_or_none() is not None:
        return "DUPLICATE_KEY"

    criterion = EvaluationCriterion(
        hackathon_id=hackathon_id,
        **values,
    )

    db.add(criterion)

    try:
        await db.commit()
        await db.refresh(criterion)
    except IntegrityError:
        await db.rollback()
        return "DUPLICATE_KEY"

    return criterion


async def update_evaluation_criterion(
    db: AsyncSession,
    criterion_id: UUID,
    organizer_id: UUID,
    data: EvaluationCriterionUpdate,
):
    result = await db.execute(
        select(EvaluationCriterion).where(
            EvaluationCriterion.id == criterion_id
        )
    )
    criterion = result.scalar_one_or_none()

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

    values = data.model_dump(exclude_unset=True)

    # Do not allow nullable values for required database columns.
    values = {
        key: value
        for key, value in values.items()
        if value is not None or key == "description"
    }

    if "key" in values:
        values["key"] = values["key"].strip()

        if not values["key"]:
            return "INVALID_DATA"

        duplicate_result = await db.execute(
            select(EvaluationCriterion.id).where(
                EvaluationCriterion.hackathon_id == criterion.hackathon_id,
                EvaluationCriterion.key == values["key"],
                EvaluationCriterion.id != criterion_id,
            )
        )

        if duplicate_result.scalar_one_or_none() is not None:
            return "DUPLICATE_KEY"

    if "name" in values:
        values["name"] = values["name"].strip()

        if not values["name"]:
            return "INVALID_DATA"

    for field, value in values.items():
        setattr(criterion, field, value)

    try:
        await db.commit()
        await db.refresh(criterion)
    except IntegrityError:
        await db.rollback()
        return "DUPLICATE_KEY"

    return criterion


async def delete_evaluation_criterion(
    db: AsyncSession,
    criterion_id: UUID,
    organizer_id: UUID,
):
    result = await db.execute(
        select(EvaluationCriterion).where(
            EvaluationCriterion.id == criterion_id
        )
    )
    criterion = result.scalar_one_or_none()

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

    await db.delete(criterion)
    await db.commit()

    return criterion
