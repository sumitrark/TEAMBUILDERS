from uuid import UUID

from pydantic import BaseModel


class ParticipantCreate(BaseModel):
    hackathon_id: UUID


class ParticipantResponse(BaseModel):
    id: UUID
    user_id: UUID
    hackathon_id: UUID
    team_id: UUID | None
    status: str

    model_config = {
        "from_attributes": True,
    }