
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class InvitationCreate(BaseModel):
    user_id: UUID


class InvitationResponse(BaseModel):
    id: UUID
    team_id: UUID
    inviter_id: UUID
    invitee_id: UUID
    status: str
    created_at: datetime
    responded_at: datetime | None = None

    # Additional display information
    inviter_name: str | None = None
    team_name: str | None = None
    team_description: str | None = None
    team_max_members: int | None = None

    model_config = ConfigDict(from_attributes=True)
