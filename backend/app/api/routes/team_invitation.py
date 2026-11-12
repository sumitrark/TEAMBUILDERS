
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user

from app.crud.team_invitation import (
    create_invitation,
    get_my_invitations,
    respond_to_invitation,
)

from app.schemas.team_invitation import (
    InvitationCreate,
    InvitationResponse,
)


router = APIRouter(
    prefix="/team-invitations",
    tags=["Team Invitations"],
)


@router.post(
    "/{team_id}",
    response_model=InvitationResponse,
)
async def invite_member(
    team_id: UUID,
    data: InvitationCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await create_invitation(
        db=db,
        team_id=team_id,
        inviter_id=current_user.id,
        invitee_id=data.user_id,
    )

    error_map = {
        "TEAM_NOT_FOUND": (404, "Team not found"),
        "USER_NOT_FOUND": (404, "User not found"),
        "INVITER_NOT_FOUND": (404, "Inviter not found"),
        "NOT_TEAM_OWNER": (403, "Only the team owner can invite members"),
        "CANNOT_INVITE_SELF": (400, "You cannot invite yourself"),
        "ALREADY_MEMBER": (409, "User is already a team member"),
        "TEAM_FULL": (409, "Team has reached its maximum members"),
        "INVITATION_EXISTS": (409, "Invitation already exists"),
    }

    if isinstance(result, str) and result in error_map:
        code, message = error_map[result]
        raise HTTPException(status_code=code, detail=message)

    if isinstance(result, str):
        raise HTTPException(status_code=400, detail=result)

    return result


@router.get(
    "/my",
    response_model=list[InvitationResponse],
)
async def my_invitations(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_my_invitations(
        db=db,
        user_id=current_user.id,
    )


@router.post(
    "/{invitation_id}/accept",
    response_model=InvitationResponse,
)
async def accept_invitation(
    invitation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await respond_to_invitation(
        db=db,
        invitation_id=invitation_id,
        user_id=current_user.id,
        accept=True,
    )

    error_map = {
        "NOT_FOUND": (404, "Invitation not found"),
        "ALREADY_RESPONDED": (409, "Invitation already responded to"),
        "USER_NOT_FOUND": (404, "Active student account not found"),
        "TEAM_NOT_FOUND": (404, "Team not found"),
        "TEAM_FULL": (409, "Team has reached its maximum members"),
        "ALREADY_MEMBER": (409, "You are already a member of this team"),
        "ALREADY_REGISTERED": (
            409,
            "You are already registered for another team or individually",
        ),
    }

    if isinstance(result, str) and result in error_map:
        code, message = error_map[result]
        raise HTTPException(status_code=code, detail=message)

    if isinstance(result, dict) and "CONFLICT" in result:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Hackathon schedule conflict",
                **result["CONFLICT"],
            },
        )

    if isinstance(result, str):
        raise HTTPException(status_code=400, detail=result)

    return result


@router.post(
    "/{invitation_id}/decline",
    response_model=InvitationResponse,
)
async def decline_invitation(
    invitation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await respond_to_invitation(
        db=db,
        invitation_id=invitation_id,
        user_id=current_user.id,
        accept=False,
    )

    error_map = {
        "NOT_FOUND": (404, "Invitation not found"),
        "ALREADY_RESPONDED": (409, "Invitation already responded to"),
        "TEAM_NOT_FOUND": (404, "Team not found"),
    }

    if isinstance(result, str) and result in error_map:
        code, message = error_map[result]
        raise HTTPException(status_code=code, detail=message)

    if isinstance(result, str):
        raise HTTPException(status_code=400, detail=result)

    return result

