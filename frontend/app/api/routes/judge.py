from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import (
    get_current_user,
)
from app.schemas.judge import (
    JudgeAcceptRequest,
)
from app.crud.organizer import (
    accept_judge_invitation,
)


router = APIRouter(
    prefix="/judge",
    tags=["Judge"],
)


@router.post(
    "/hackathons/{hackathon_id}/accept"
)
async def accept(
    hackathon_id: UUID,
    payload: JudgeAcceptRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await accept_judge_invitation(
        db=db,
        user_id=current_user.id,
        hackathon_id=hackathon_id,
        invitation_code=payload.invitation_code,
    )

    if result == "INVITATION_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Judge invitation not found",
        )

    if result == "INVITATION_ALREADY_PROCESSED":
        raise HTTPException(
            status_code=409,
            detail="Invitation already processed",
        )

    if result == "INVALID_INVITATION_CODE":
        raise HTTPException(
            status_code=403,
            detail="Invalid invitation code",
        )

    if result == "HACKATHON_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Hackathon not found",
        )

    if isinstance(result, dict):
        raise HTTPException(
            status_code=409,
            detail=result,
        )

    return {
        "message":
            "Judge invitation accepted",
        "judge_id": result.id,
        "hackathon_id":
            result.hackathon_id,
        "status": result.status,
    }