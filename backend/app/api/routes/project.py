from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user

from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
)
from app.schemas.submission import (
    SubmissionResponse,
    ProjectStatusResponse,
)

from app.crud.project import (
    create_project,
    get_my_projects,
    get_project,
    update_project,
    delete_project,
)
from app.crud.submission import (
    submit_project,
    get_project_submission_status,
)


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


# =========================================================
# CREATE PROJECT
# =========================================================

@router.post(
    "",
    response_model=ProjectResponse,
)
async def create_new_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await create_project(
        db,
        current_user.id,
        project,
    )


# =========================================================
# GET MY PROJECTS
# =========================================================

@router.get(
    "/my",
    response_model=list[ProjectResponse],
)
async def my_projects(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_my_projects(
        db,
        current_user.id,
    )


# =========================================================
# GET SINGLE PROJECT
# =========================================================

@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
async def project_details(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    project = await get_project(
        db,
        project_id,
        current_user.id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you are not the owner",
        )

    return project


# =========================================================
# UPDATE PROJECT
# =========================================================

@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
async def edit_project(
    project_id: UUID,
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    updated_project = await update_project(
        db,
        project_id,
        current_user.id,
        project,
    )

    if updated_project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you are not the owner",
        )

    if updated_project == "PROJECT_LOCKED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your project has already been submitted and is locked.",
        )

    if updated_project == "HACKATHON_FINISHED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This hackathon has ended. Projects can no longer be edited.",
        )

    return updated_project


# =========================================================
# DELETE PROJECT
# =========================================================

@router.delete(
    "/{project_id}",
)
async def remove_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = await delete_project(
        db,
        project_id,
        current_user.id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you are not the owner",
        )

    return {
        "message": "Project deleted successfully"
    }


# =========================================================
# SUBMIT PROJECT
#
# Server-side deadline enforcement lives entirely in
# crud.submission.submit_project() - the frontend countdown is a
# convenience display only, never the authority.
# =========================================================

@router.post(
    "/{project_id}/submit",
    response_model=SubmissionResponse,
)
async def submit_project_route(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await submit_project(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
    )

    if result == "PROJECT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if result == "PROJECT_HAS_NO_TEAM":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This project has no team and cannot be submitted",
        )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found",
        )

    if result == "NOT_AUTHORIZED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to submit this project",
        )

    if result == "HACKATHON_NOT_STARTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This hackathon has not started yet.",
        )

    if result == "SUBMISSION_WINDOW_CLOSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission deadline has passed.",
        )

    if result == "PROJECT_LOCKED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your project has already been submitted and is locked.",
        )

    return result


@router.get(
    "/{project_id}/submission",
    response_model=ProjectStatusResponse,
)
async def project_submission_status_route(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await get_project_submission_status(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
    )

    if result == "PROJECT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if result == "NOT_AUTHORIZED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this project",
        )

    return result
