from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class JudgeInviteCreate(BaseModel):
    email: EmailStr
    invitation_code: str


class JudgeResponse(BaseModel):
    id: UUID
    hackathon_id: UUID
    user_id: UUID
    status: str
    is_verified: bool
    invited_at: datetime
    accepted_at: datetime | None

    model_config = {
        "from_attributes": True
    }


class JudgeAcceptRequest(BaseModel):
    invitation_code: str


class JudgeVerificationResponse(BaseModel):
    message: str
    judge_id: UUID
    hackathon_id: UUID
    status: str