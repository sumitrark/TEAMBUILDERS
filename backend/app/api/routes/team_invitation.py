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

    if result == "TEAM_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Team not found",
        )

    if result == "USER_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if result == "ALREADY_MEMBER":
        raise HTTPException(
            status_code=400,
            detail="User is already a team member",
        )

    if result == "TEAM_FULL":
        raise HTTPException(
            status_code=400,
            detail="Team has reached its maximum members",
        )

    if result == "INVITATION_EXISTS":
        raise HTTPException(
            status_code=400,
            detail="Invitation already exists",
        )

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

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Invitation not found",
        )

    if result == "ALREADY_RESPONDED":
        raise HTTPException(
            status_code=400,
            detail="Invitation already responded to",
        )

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

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Invitation not found",
        )

    if result == "ALREADY_RESPONDED":
        raise HTTPException(
            status_code=400,
            detail="Invitation already responded to",
        )

    if result == "TEAM_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Team not found",
        )

    if result == "TEAM_FULL":
        raise HTTPException(
            status_code=400,
            detail="Team has reached its maximum members",
        )

    if result == "ALREADY_MEMBER":
        raise HTTPException(
            status_code=400,
            detail="You are already a member of this team",
        )

    if isinstance(result, dict) and "CONFLICT" in result:
        conflict = result["CONFLICT"]

        raise HTTPException(
            status_code=409,
            detail={
                "message": "Hackathon schedule conflict",
                **conflict,
            },
        ) 

    return result