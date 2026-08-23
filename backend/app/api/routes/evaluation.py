from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user

from app.schemas.evaluation import (
    EvaluationCreate,
    EvaluationResponse,
)
from app.schemas.ai_evaluation import AiEvaluationResponse

from app.crud.evaluation import (
    create_evaluation,
    get_my_evaluations,
    get_project_evaluations,
    get_project_score,
)
from app.crud.ai_evaluation import get_ai_evaluation_by_project

from app.services.ai_evaluation_service import generate_ai_evaluation


router = APIRouter(
    prefix="/evaluations",
    tags=["Evaluations"],
)


# =========================================================
# SUBMIT EVALUATION
# =========================================================

@router.post(
    "",
    response_model=EvaluationResponse,
)
async def submit_evaluation(
    evaluation: EvaluationCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await create_evaluation(
        db=db,
        user_id=current_user.id,
        data=evaluation,
    )

    if result == "NOT_A_JUDGE":
        raise HTTPException(
            status_code=403,
            detail="You are not an authorized judge",
        )

    if result == "PROJECT_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    if result == "PROJECT_HAS_NO_TEAM":
        raise HTTPException(
            status_code=400,
            detail="Project is not associated with a team",
        )

    if result == "TEAM_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Project team not found",
        )

    if result == "JUDGE_HACKATHON_MISMATCH":
        raise HTTPException(
            status_code=403,
            detail="Judge is not assigned to this hackathon",
        )

    if result == "SELF_EVALUATION_NOT_ALLOWED":
        raise HTTPException(
            status_code=403,
            detail="You cannot evaluate your own team",
        )

    if result == "ALREADY_EVALUATED":
        raise HTTPException(
            status_code=409,
            detail="You have already evaluated this project",
        )

    return result


# =========================================================
# MY EVALUATIONS
# =========================================================

@router.get(
    "/my",
    response_model=list[EvaluationResponse],
)
async def my_evaluations(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_my_evaluations(
        db=db,
        judge_id=current_user.id,
    )


# =========================================================
# PROJECT EVALUATIONS
# =========================================================

@router.get(
    "/project/{project_id}",
    response_model=list[EvaluationResponse],
)
async def project_evaluations(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_project_evaluations(
        db=db,
        project_id=project_id,
    )


# =========================================================
# PROJECT SCORE
# =========================================================

@router.get(
    "/project/{project_id}/score",
)
async def project_score(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_project_score(
        db=db,
        project_id=project_id,
    )


# =========================================================
# AI-ASSISTED EVALUATION
#
# Advisory only - never authoritative. The human Evaluation
# table above remains the score that counts; this is a
# separate, clearly-labeled AI read to help a judge get
# started, restricted to judges/organizers.
# =========================================================

@router.post(
    "/ai/{project_id}",
    response_model=AiEvaluationResponse,
)
async def generate_ai_evaluation_endpoint(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role not in ("judge", "organizer"):
        raise HTTPException(
            status_code=403,
            detail="Only judges and organizers can request an AI evaluation",
        )

    try:
        return await generate_ai_evaluation(
            db=db,
            project_id=project_id,
            requested_by_user_id=current_user.id,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        message = str(exc)

        status_code = (
            status.HTTP_429_TOO_MANY_REQUESTS
            if "limit" in message.lower()
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )

        raise HTTPException(
            status_code=status_code,
            detail=message,
        ) from exc


@router.get(
    "/ai/{project_id}",
    response_model=AiEvaluationResponse,
)
async def get_ai_evaluation_endpoint(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await get_ai_evaluation_by_project(db, project_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="No AI evaluation has been generated for this project yet",
        )

    return result