from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, EmailStr


class JudgeInviteRequest(BaseModel):
    email: EmailStr


class JudgeInvitationResponse(BaseModel):
    id: UUID
    hackathon_id: UUID
    invited_email: str
    invited_user_id: UUID | None
    status: str
    expires_at: datetime
    accepted_at: datetime | None
    declined_at: datetime | None
    created_at: datetime

    # Only ever populated when there's no email provider configured,
    # so the organizer can copy/share it manually. Never included on
    # any response the invited person themselves would see.
    dev_invitation_link: str | None = None


class JudgeInvitationPublicResponse(BaseModel):
    """
    What the invitation landing page (/judge/invite/[token]) can show
    BEFORE the viewer is necessarily authenticated as the right
    person - intentionally excludes anything sensitive.
    """

    hackathon_id: UUID
    hackathon_title: str
    organizer_name: str
    invited_email: str
    status: str
    expires_at: datetime
    is_expired: bool


class MyJudgeInvitationResponse(BaseModel):
    invitation_id: UUID
    hackathon_id: UUID
    hackathon_title: str
    organizer_name: str
    status: str
    created_at: datetime
    expires_at: datetime
