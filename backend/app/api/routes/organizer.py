from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.organizer import get_current_organizer

from app.crud.organizer import (
    get_organizer_hackathons,
    get_organizer_stats,
    update_organizer_hackathon,
    delete_organizer_hackathon,
    toggle_hackathon_status,
    get_organizer_participants,
    get_organizer_teams,
    remove_team_member,
    delete_organizer_team,
    get_organizer_judges,
    invite_judge,
    get_organizer_project,
    remove_judge,
    get_organizer_analytics,
)

from app.schemas.organizer import (
    OrganizerStatsResponse,
    OrganizerHackathonUpdate,
)
from app.schemas.judge import JudgeInviteRequest

router = APIRouter(
    prefix="/organizer",
    tags=["Organizer"],
)


# ============================================================
# DASHBOARD STATS
# ============================================================

@router.get(
    "/stats",
    response_model=OrganizerStatsResponse,
)
async def stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    return await get_organizer_stats(
        db=db,
        organizer_id=current_user.id,
    )


# ============================================================
# ORGANIZER HACKATHONS
# ============================================================

@router.get("/hackathons")
async def my_hackathons(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    return await get_organizer_hackathons(
        db=db,
        organizer_id=current_user.id,
    )


# ============================================================
# UPDATE HACKATHON
# ============================================================

@router.put("/hackathons/{hackathon_id}")
async def update_hackathon(
    hackathon_id: UUID,
    payload: OrganizerHackathonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await update_organizer_hackathon(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
        data=payload,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return result


# ============================================================
# DELETE HACKATHON
# ============================================================

@router.delete("/hackathons/{hackathon_id}")
async def delete_hackathon(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    deleted = await delete_organizer_hackathon(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return {
        "message": "Hackathon deleted successfully"
    }


# ============================================================
# OPEN / CLOSE HACKATHON
# ============================================================

@router.patch("/hackathons/{hackathon_id}/status")
async def change_hackathon_status(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await toggle_hackathon_status(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return result

# ============================================================
# ORGANIZER PROJECTS
# ============================================================

@router.get(
    "/hackathons/{hackathon_id}/projects",
)
async def projects(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await get_organizer_projects(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found or you do not own it",
        )

    return result


@router.get(
    "/hackathons/{hackathon_id}/projects/{project_id}",
)
async def project(
    hackathon_id: UUID,
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await get_organizer_project(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
        project_id=project_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return result
# ============================================================
# PARTICIPANTS
# ============================================================

@router.get(
    "/hackathons/{hackathon_id}/participants"
)
async def participants(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await get_organizer_participants(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return result


# ============================================================
# TEAMS
# ============================================================

@router.get(
    "/hackathons/{hackathon_id}/teams"
)
async def teams(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await get_organizer_teams(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return result

# ============================================================
# TEAM MANAGEMENT
# ============================================================

@router.delete(
    "/hackathons/{hackathon_id}/teams/{team_id}/members/{user_id}"
)
async def remove_team_member_route(
    hackathon_id: UUID,
    team_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await remove_team_member(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
        team_id=team_id,
        user_id=user_id,
    )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found or you do not own it",
        )

    if result == "TEAM_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    if result == "OWNER_CANNOT_BE_REMOVED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The team owner cannot be removed from the team",
        )

    if result == "MEMBER_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found",
        )

    return {
        "message": "Team member removed successfully"
    }


@router.delete(
    "/hackathons/{hackathon_id}/teams/{team_id}"
)
async def delete_team_route(
    hackathon_id: UUID,
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await delete_organizer_team(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
        team_id=team_id,
    )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found or you do not own it",
        )

    if result == "TEAM_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    return {
        "message": "Team deleted successfully"
    }
# ============================================================
# JUDGES
# ============================================================

@router.get(
    "/hackathons/{hackathon_id}/judges"
)
async def judges(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await get_organizer_judges(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return result


@router.post(
    "/hackathons/{hackathon_id}/judges/invite",
)
async def invite_hackathon_judge(
    hackathon_id: UUID,
    payload: JudgeInviteRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await invite_judge(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
        email=payload.email,
    )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found or you do not own it",
        )

    if result == "USER_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user found with this email",
        )

    if result == "PARTICIPANT_CONFLICT":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A participant cannot be invited as a judge",
        )

    if result == "ALREADY_JUDGE":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user is already a judge",
        )

    return {
        "message": "Judge invitation created successfully",
        "judge_id": result.id,
        "hackathon_id": result.hackathon_id,
        "user_id": result.user_id,
        "email": payload.email,
        "status": result.status,
    }
# ============================================================
# ANALYTICS
# ============================================================

@router.get(
    "/hackathons/{hackathon_id}/analytics"
)
async def analytics(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await get_organizer_analytics(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found or you do not own it",
        )

    return result