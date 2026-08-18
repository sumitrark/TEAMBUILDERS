from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TeamMemberCreate(BaseModel):
    user_id: UUID


class TeamMemberResponse(BaseModel):
    id: UUID
    team_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)