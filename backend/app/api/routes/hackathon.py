from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from app.schemas.workspace import WorkspacePresenceResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

from app.dependencies.organizer import (
    get_current_organizer,
)
from app.dependencies.current_user import get_current_user

from app.schemas.hackathon import (
    HackathonCreate,
    HackathonResponse,
    HackathonUpdate,
)

from app.crud.hackathon import (
    create_hackathon,
    get_all_hackathons,
    get_hackathon,
    update_hackathon,
    delete_hackathon,
    set_hackathon_status,
)

from app.crud.submission import (
    submit_project,
    get_project_submission_status,
)
from app.schemas.submission import (
    SubmissionResponse,
    ProjectStatusResponse,
)

router = APIRouter(
    prefix="/hackathons",
    tags=["Hackathons"],
)


# =========================================================
# PUBLIC / PARTICIPANT
# =========================================================

@router.get(
    "/",
    response_model=list[HackathonResponse],
)
async def all_hackathons(
    db: AsyncSession = Depends(get_db),
):
    from app.services.hackathon_lifecycle import get_hackathon_status

    hackathons = await get_all_hackathons(db)

    for h in hackathons:
        h.lifecycle_status = get_hackathon_status(h)

    return hackathons


@router.get(
    "/{hackathon_id}/status",
)
async def hackathon_status(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    from app.services.hackathon_lifecycle import (
        get_hackathon_status,
        get_time_remaining_seconds,
    )
    from datetime import datetime, timezone

    hackathon = await get_hackathon(db, hackathon_id)

    if hackathon is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found",
        )

    status_value = get_hackathon_status(hackathon)

    return {
        "hackathon_id": hackathon.id,
        "status": status_value,
        "server_time": datetime.now(timezone.utc),
        "seconds_remaining": get_time_remaining_seconds(hackathon),
    }


@router.get(
    "/{hackathon_id}/workspace",
)
async def hackathon_workspace(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.crud.workspace import get_workspace

    result = await get_workspace(
        db=db,
        user_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found",
        )

    if result == "NOT_REGISTERED":
        raise HTTPException(
            status_code=403,
            detail="You are not registered for this hackathon",
        )

    return result

@router.post(
    "/{hackathon_id}/workspace/presence",
    response_model=WorkspacePresenceResponse,
)
async def hackathon_workspace_presence(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.crud.workspace import update_workspace_presence

    result = await update_workspace_presence(
        db=db,
        user_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result == "NOT_REGISTERED":
        raise HTTPException(
            status_code=403,
            detail="You are not registered for this hackathon",
        )

    return result
@router.get(
    "/{hackathon_id}",
    response_model=HackathonResponse,
)
async def single_hackathon(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    hackathon = await get_hackathon(
        db,
        hackathon_id,
    )

    if hackathon is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found",
        )

    from app.services.hackathon_lifecycle import get_hackathon_status

    hackathon.lifecycle_status = get_hackathon_status(hackathon)

    return hackathon

# =========================================================
# PARTICIPANT SUBMISSIONS
# =========================================================

@router.post(
    "/{hackathon_id}/submissions/{project_id}",
    response_model=SubmissionResponse,
)
async def submit_hackathon_project(
    hackathon_id: UUID,
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await submit_project(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
    )

    if isinstance(result, str):
        error_map = {
            "PROJECT_NOT_FOUND": (404, "Project not found"),
            "PROJECT_HAS_NO_TEAM": (400, "Project is not associated with a team"),
            "HACKATHON_NOT_FOUND": (404, "Hackathon not found"),
            "NOT_AUTHORIZED": (403, "You are not authorized to submit this project"),
            "HACKATHON_NOT_STARTED": (400, "The hackathon submission window is not open"),
            "SUBMISSION_WINDOW_CLOSED": (400, "The submission window is closed"),
            "PROJECT_LOCKED": (400, "This project is locked and cannot be submitted"),
        }

        status_code, detail = error_map.get(
            result,
            (400, "Unable to submit project"),
        )

        raise HTTPException(
            status_code=status_code,
            detail=detail,
        )

    if result.hackathon_id != hackathon_id:
        raise HTTPException(
            status_code=403,
            detail="Project does not belong to this hackathon",
        )

    return result


@router.get(
    "/{hackathon_id}/submissions/{project_id}/status",
    response_model=ProjectStatusResponse,
)
async def hackathon_project_submission_status(
    hackathon_id: UUID,
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await get_project_submission_status(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
    )

    if isinstance(result, str):
        error_map = {
            "PROJECT_NOT_FOUND": (404, "Project not found"),
            "NOT_AUTHORIZED": (403, "You are not authorized to view this project"),
        }

        status_code, detail = error_map.get(
            result,
            (400, "Unable to load submission status"),
        )

        raise HTTPException(
            status_code=status_code,
            detail=detail,
        )

    # Make sure the project belongs to the requested hackathon.
    latest = result.get("latest_submission")

    if latest is not None and latest.hackathon_id != hackathon_id:
        raise HTTPException(
            status_code=403,
            detail="Project does not belong to this hackathon",
        )

    return result
# =========================================================
# ORGANIZER - CREATE
# =========================================================

@router.post(
    "/organizer/create",
    response_model=HackathonResponse,
)
async def organizer_create(
    payload: HackathonCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    return await create_hackathon(
        db=db,
        data=payload,
        organizer_id=current_user.id,
    )


# =========================================================
# ORGANIZER - UPDATE
# =========================================================

@router.put(
    "/organizer/{hackathon_id}",
    response_model=HackathonResponse,
)
async def organizer_update(
    hackathon_id: UUID,
    payload: HackathonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await update_hackathon(
        db=db,
        hackathon_id=hackathon_id,
        organizer_id=current_user.id,
        data=payload,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or access denied",
        )

    return result


# =========================================================
# ORGANIZER - DELETE
# =========================================================

@router.delete(
    "/organizer/{hackathon_id}",
)
async def organizer_delete(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await delete_hackathon(
        db=db,
        hackathon_id=hackathon_id,
        organizer_id=current_user.id,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or access denied",
        )

    return {
        "message": "Hackathon cancelled successfully"
    }


# =========================================================
# ORGANIZER - STATUS
# =========================================================

@router.patch(
    "/organizer/{hackathon_id}/status",
    response_model=HackathonResponse,
)
async def organizer_status(
    hackathon_id: UUID,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await set_hackathon_status(
        db=db,
        hackathon_id=hackathon_id,
        organizer_id=current_user.id,
        status=status,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or access denied",
        )

    if result == "INVALID_STATUS":
        raise HTTPException(
            status_code=400,
            detail="Invalid hackathon status",
        )

    return result
