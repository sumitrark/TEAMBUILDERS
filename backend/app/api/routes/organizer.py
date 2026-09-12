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
    get_organizer_judge_invitations,
    resend_organizer_judge_invitation,
    cancel_organizer_judge_invitation,
    get_organizer_project,
    remove_judge,
    get_organizer_analytics,
)

from app.core.config import settings

from app.schemas.organizer import (
    OrganizerStatsResponse,
    OrganizerHackathonUpdate,
)
from app.schemas.judge import JudgeInviteRequest
from app.schemas.judge_invitation import JudgeInvitationResponse

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
    response_model=JudgeInvitationResponse,
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

    if result == "PARTICIPANT_CONFLICT":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A participant cannot be invited as a judge",
        )

    if result == "ALREADY_JUDGE":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user is already an active judge",
        )

    if result == "ALREADY_INVITED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "There is already a pending invitation for this email. "
                "Use resend instead of creating a new one."
            ),
        )

    dev_invitation_link = None

    if not settings.EMAIL_PROVIDER:
        # No real email infrastructure configured - never pretend an
        # email was sent. Hand the organizer the link directly so
        # development/testing isn't blocked.
        dev_invitation_link = (
            f"{settings.FRONTEND_URL}/judge/invite/{result.token}"
        )

    return {
        "id": result.id,
        "hackathon_id": result.hackathon_id,
        "invited_email": result.invited_email,
        "invited_user_id": result.invited_user_id,
        "status": result.status,
        "expires_at": result.expires_at,
        "accepted_at": result.accepted_at,
        "declined_at": result.declined_at,
        "created_at": result.created_at,
        "dev_invitation_link": dev_invitation_link,
    }


@router.get(
    "/hackathons/{hackathon_id}/judges/invitations",
    response_model=list[JudgeInvitationResponse],
)
async def list_hackathon_judge_invitations(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await get_organizer_judge_invitations(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found or you do not own it",
        )

    response = []

    for invitation in result:
        dev_invitation_link = None

        if not settings.EMAIL_PROVIDER and invitation.status == "pending":
            dev_invitation_link = (
                f"{settings.FRONTEND_URL}/judge/invite/{invitation.token}"
            )

        response.append(
            {
                "id": invitation.id,
                "hackathon_id": invitation.hackathon_id,
                "invited_email": invitation.invited_email,
                "invited_user_id": invitation.invited_user_id,
                "status": invitation.status,
                "expires_at": invitation.expires_at,
                "accepted_at": invitation.accepted_at,
                "declined_at": invitation.declined_at,
                "created_at": invitation.created_at,
                "dev_invitation_link": dev_invitation_link,
            }
        )

    return response


@router.post(
    "/hackathons/{hackathon_id}/judges/invitations/{invitation_id}/resend",
    response_model=JudgeInvitationResponse,
)
async def resend_hackathon_judge_invitation(
    hackathon_id: UUID,
    invitation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await resend_organizer_judge_invitation(
        db=db,
        organizer_id=current_user.id,
        invitation_id=invitation_id,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )

    if result == "NOT_RESENDABLE":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending or expired invitations can be resent",
        )

    dev_invitation_link = None

    if not settings.EMAIL_PROVIDER:
        dev_invitation_link = (
            f"{settings.FRONTEND_URL}/judge/invite/{result.token}"
        )

    return {
        "id": result.id,
        "hackathon_id": result.hackathon_id,
        "invited_email": result.invited_email,
        "invited_user_id": result.invited_user_id,
        "status": result.status,
        "expires_at": result.expires_at,
        "accepted_at": result.accepted_at,
        "declined_at": result.declined_at,
        "created_at": result.created_at,
        "dev_invitation_link": dev_invitation_link,
    }


@router.delete(
    "/hackathons/{hackathon_id}/judges/invitations/{invitation_id}",
)
async def cancel_hackathon_judge_invitation(
    hackathon_id: UUID,
    invitation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await cancel_organizer_judge_invitation(
        db=db,
        organizer_id=current_user.id,
        invitation_id=invitation_id,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )

    if result == "NOT_CANCELLABLE":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending invitations can be cancelled",
        )

    return {"message": "Invitation cancelled"}


@router.delete(
    "/hackathons/{hackathon_id}/judges/{judge_id}",
)
async def remove_hackathon_judge(
    hackathon_id: UUID,
    judge_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_organizer),
):
    result = await remove_judge(
        db=db,
        organizer_id=current_user.id,
        hackathon_id=hackathon_id,
        judge_id=judge_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found or you do not own it",
        )

    if result is False:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Judge not found for this hackathon",
        )

    return {"message": "Judge removed successfully"}
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