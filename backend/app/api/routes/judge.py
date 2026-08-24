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
from app.schemas.judge import JudgeAcceptRequest
from app.crud.organizer import accept_judge_invitation
from app.schemas.judge import (
    JudgeAcceptRequest,
    JudgeProjectResponse,
    JudgePendingInvitationResponse,
)

from app.crud.judge import (
    get_judge_projects,
    get_pending_invitations,
    accept_invitation_by_id,
    decline_invitation_by_id,
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

    if result == "NOT_JUDGE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an active judge for this hackathon",
        )

    return result


# ============================================================
# PENDING INVITATIONS
#
# For a judge invited by email via the organizer's per-user
# invite flow (crud/organizer.py::invite_judge) - separate from
# the shared invitation-code self-service flow above.
# ============================================================

@router.get(
    "/invitations/pending",
    response_model=list[JudgePendingInvitationResponse],
)
async def pending_invitations(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_pending_invitations(
        db=db,
        user_id=current_user.id,
    )


@router.post("/invitations/{judge_id}/accept")
async def accept_invitation(
    judge_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await accept_invitation_by_id(
        db=db,
        judge_id=judge_id,
        user_id=current_user.id,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )

    if result == "NOT_YOUR_INVITATION":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation does not belong to you",
        )

    if result == "NOT_PENDING":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This invitation is no longer pending",
        )

    return {
        "message": "Judge invitation accepted successfully",
        "judge_id": result.id,
        "hackathon_id": result.hackathon_id,
        "status": result.status,
    }


@router.post("/invitations/{judge_id}/decline")
async def decline_invitation(
    judge_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await decline_invitation_by_id(
        db=db,
        judge_id=judge_id,
        user_id=current_user.id,
    )

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )

    if result == "NOT_YOUR_INVITATION":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation does not belong to you",
        )

    if result == "NOT_PENDING":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This invitation is no longer pending",
        )

    return {
        "message": "Judge invitation declined",
        "judge_id": result.id,
        "status": result.status,
    }