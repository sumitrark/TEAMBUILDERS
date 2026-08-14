from uuid import UUID
from pydantic import BaseModel


class ParticipantCreate(BaseModel):
    hackathon_id: UUID


class ParticipantResponse(BaseModel):
    id: UUID
    user_id: UUID
    hackathon_id: UUID
    status: str

    model_config = {
        "from_attributes": True
    }