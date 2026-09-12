from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user
from app.schemas.judge import JudgeAcceptRequest
from app.crud.organizer import accept_judge_invitation
from app.schemas.judge import (
    JudgeAcceptRequest,
    JudgeProjectResponse,
    MyJudgeHackathonResponse,
)
from app.schemas.judge_invitation import (
    JudgeInvitationPublicResponse,
    MyJudgeInvitationResponse,
)

from app.crud.judge import get_judge_projects, get_judge_project, get_my_judge_hackathons
from app.crud.judge_invitation import (
    accept_invitation as accept_judge_invitation_by_token,
    decline_invitation as decline_judge_invitation_by_token,
    get_invitation_by_id,
    get_invitation_by_token,
    get_pending_invitations_for_user,
)

router = APIRouter(
    prefix="/judge",
    tags=["Judge"],
)


@router.post(
    "/hackathons/accept",
)
async def accept(
    payload: JudgeAcceptRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await accept_judge_invitation(
        db=db,
        user_id=current_user.id,
        invitation_code=payload.invitation_code,
    )

    # Invalid invitation code
    if result == "INVALID_CODE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid invitation code",
        )

    # Hackathon is closed
    if result == "HACKATHON_CLOSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hackathon is closed",
        )

    # Organizer cannot judge own hackathon
    if result == "ORGANIZER_CANNOT_BE_JUDGE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hackathon organizer cannot become a judge",
        )

    # If the user is already a judge
    if result == "ALREADY_JUDGE":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already a judge for this hackathon",
        )

    # Safety check for unexpected string responses
    if isinstance(result, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result,
        )

    return {
        "message": "Judge invitation accepted successfully",
        "judge_id": result.id,
        "hackathon_id": result.hackathon_id,
        "user_id": result.user_id,
        "status": result.status,
    }


# ============================================================
# MY ASSIGNED HACKATHONS (Judge Portal dashboard)
# ============================================================

@router.get(
    "/hackathons",
    response_model=list[MyJudgeHackathonResponse],
)
async def my_judge_hackathons(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_my_judge_hackathons(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/hackathons/{hackathon_id}/projects",
    response_model=list[JudgeProjectResponse],
)
async def judge_projects(
    hackathon_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await get_judge_projects(
        db=db,
        user_id=current_user.id,
        hackathon_id=hackathon_id,
    )

    if result == "NOT_ACTIVE_JUDGE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an active judge for this hackathon",
        )

    return result


@router.get(
    "/hackathons/{hackathon_id}/projects/{project_id}",
    response_model=JudgeProjectResponse,
)
async def judge_project_detail(
    hackathon_id: UUID,
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await get_judge_project(
        db=db,
        user_id=current_user.id,
        hackathon_id=hackathon_id,
        project_id=project_id,
    )

    if result == "NOT_ACTIVE_JUDGE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an active judge for this hackathon",
        )

    if result == "PROJECT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found in this hackathon",
        )

    return result


# ============================================================
# PENDING INVITATIONS (authenticated, in-app)
#
# Backs the unified /dashboard/invitations page for a logged-in
# user who has one or more pending judge invitations - whether
# they were invited before or after they had an account.
# ============================================================

@router.get(
    "/invitations/pending",
    response_model=list[MyJudgeInvitationResponse],
)
async def pending_invitations(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_pending_invitations_for_user(
        db=db,
        user_id=current_user.id,
        email=current_user.email,
    )


@router.post("/invitations/{invitation_id}/accept")
async def accept_invitation(
    invitation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invitation = await get_invitation_by_id(db, invitation_id)

    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )

    result = await accept_judge_invitation_by_token(
        db=db,
        invitation=invitation,
        user=current_user,
    )

    return _handle_invitation_response_result(result, accepted=True)


@router.post("/invitations/{invitation_id}/decline")
async def decline_invitation(
    invitation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invitation = await get_invitation_by_id(db, invitation_id)

    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )

    result = await decline_judge_invitation_by_token(
        db=db,
        invitation=invitation,
        user=current_user,
    )

    return _handle_invitation_response_result(result, accepted=False)


# ============================================================
# INVITATION LANDING PAGE (token-based, works pre-authentication)
#
# Powers /judge/invite/[token] on the frontend - the link an
# invited person clicks whether or not they have an account yet.
# ============================================================

@router.get(
    "/invitations/token/{token}",
    response_model=JudgeInvitationPublicResponse,
)
async def get_invitation_by_token_route(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    invitation = await get_invitation_by_token(db, token)

    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or invalid",
        )

    from datetime import datetime, timezone
    from app.models.hackathon import Hackathon
    from app.models.user import User

    hackathon_result = await db.execute(
        select(Hackathon).where(Hackathon.id == invitation.hackathon_id)
    )
    hackathon = hackathon_result.scalar_one_or_none()

    organizer_result = await db.execute(
        select(User).where(User.id == invitation.organizer_id)
    )
    organizer = organizer_result.scalar_one_or_none()

    expires_at = invitation.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    return JudgeInvitationPublicResponse(
        hackathon_id=invitation.hackathon_id,
        hackathon_title=hackathon.title if hackathon else "Unknown hackathon",
        organizer_name=organizer.full_name if organizer else "Unknown organizer",
        invited_email=invitation.invited_email,
        status=invitation.status,
        expires_at=invitation.expires_at,
        is_expired=datetime.now(timezone.utc) > expires_at,
    )


@router.post("/invitations/token/{token}/accept")
async def accept_invitation_by_token_route(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invitation = await get_invitation_by_token(db, token)

    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or invalid",
        )

    result = await accept_judge_invitation_by_token(
        db=db,
        invitation=invitation,
        user=current_user,
    )

    return _handle_invitation_response_result(result, accepted=True)


@router.post("/invitations/token/{token}/decline")
async def decline_invitation_by_token_route(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invitation = await get_invitation_by_token(db, token)

    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or invalid",
        )

    result = await decline_judge_invitation_by_token(
        db=db,
        invitation=invitation,
        user=current_user,
    )

    return _handle_invitation_response_result(result, accepted=False)


def _handle_invitation_response_result(result, accepted: bool):
    if result == "EMAIL_MISMATCH":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "This invitation was sent to a different email address. "
                "Please log in with the invited account."
            ),
        )

    if result == "ALREADY_ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This invitation has already been accepted",
        )

    if result == "NOT_PENDING":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This invitation is no longer pending",
        )

    if result == "EXPIRED":
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This invitation has expired",
        )

    return {
        "message": (
            "Judge invitation accepted successfully"
            if accepted
            else "Judge invitation declined"
        ),
        "invitation_id": result.id,
        "hackathon_id": result.hackathon_id,
        "status": result.status,
    }