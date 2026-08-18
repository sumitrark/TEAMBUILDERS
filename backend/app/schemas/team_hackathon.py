from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TeamHackathonResponse(BaseModel):
    id: UUID
    team_id: UUID
    hackathon_id: UUID
    status: str
    registered_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )