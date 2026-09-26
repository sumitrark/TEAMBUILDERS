from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.evaluation_criterion import (
    create_evaluation_criterion,
    delete_evaluation_criterion,
    get_hackathon_criteria,
    get_hackathon_for_organizer,
    update_evaluation_criterion,
)
from app.db.database import get_db
from app.dependencies.current_user import get_current_user
from app.schemas.evaluation_criterion import (
    EvaluationCriterionCreate,
    EvaluationCriterionResponse,
    EvaluationCriterionUpdate,
)


router = APIRouter(
    prefix="/organizer/hackathons",
    tags=["Evaluation Criteria"],
)


async def _require_organizer_ownership(
    db: AsyncSession,
    hackathon_id: UUID,
    current_user,
):
    if current_user.role != "organizer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can manage evaluation criteria",
        )

    hackathon = await get_hackathon_for_organizer(
        db,
        hackathon_id,
        current_user.id,
    )

    if hackathon is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the organizer of this hackathon",
        )

    return hackathon


@router.get(
    "/{hackathon_id}/criteria",
    response_model=list[EvaluationCriterionResponse],
)
async def list_criteria(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await _require_organizer_ownership(
        db,
        hackathon_id,
        current_user,
    )

    return await get_hackathon_criteria(
        db,
        hackathon_id,
        active_only=False,
    )


@router.post(
    "/{hackathon_id}/criteria",
    response_model=EvaluationCriterionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_criterion(
    hackathon_id: UUID,
    data: EvaluationCriterionCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await _require_organizer_ownership(
        db,
        hackathon_id,
        current_user,
    )

    result = await create_evaluation_criterion(
        db=db,
        hackathon_id=hackathon_id,
        organizer_id=current_user.id,
        data=data,
    )

    if result == "NOT_AUTHORIZED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the organizer of this hackathon",
        )

    if result == "DUPLICATE_KEY":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A criterion with this key already exists",
        )

    if result == "CRITERIA_LOCKED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Evaluation criteria are locked because the hackathon "
                "has started or evaluation has already begun"
            ),
        )

    return result


@router.patch(
    "/criteria/{criterion_id}",
    response_model=EvaluationCriterionResponse,
)
async def update_criterion(
    criterion_id: UUID,
    data: EvaluationCriterionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "organizer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can manage evaluation criteria",
        )

    result = await update_evaluation_criterion(
        db=db,
        criterion_id=criterion_id,
        organizer_id=current_user.id,
        data=data,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation criterion not found",
        )

    if result == "NOT_AUTHORIZED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the organizer of this hackathon",
        )

    if result == "DUPLICATE_KEY":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A criterion with this key already exists",
        )

    if result == "CRITERIA_LOCKED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Evaluation criteria are locked because the hackathon "
                "has started or evaluation has already begun"
            ),
        )

    return result


@router.delete(
    "/criteria/{criterion_id}",
    response_model=EvaluationCriterionResponse,
)
async def delete_criterion(
    criterion_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "organizer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can manage evaluation criteria",
        )

    result = await delete_evaluation_criterion(
        db=db,
        criterion_id=criterion_id,
        organizer_id=current_user.id,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation criterion not found",
        )

    if result == "NOT_AUTHORIZED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the organizer of this hackathon",
        )

    if result == "CRITERIA_LOCKED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Evaluation criteria are locked because the hackathon "
                "has started or evaluation has already begun"
            ),
        )

    return result
