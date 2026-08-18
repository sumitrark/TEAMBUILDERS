from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


# =========================================================
# CREATE / UPDATE TEAM
# =========================================================

class TeamCreate(BaseModel):

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    max_members: int = Field(
        default=4,
        ge=2,
        le=10,
    )

    # Hackathon is selected later during registration.
    hackathon_id: UUID | None = None


# =========================================================
# TEAM RESPONSE
# =========================================================

class TeamResponse(BaseModel):

    id: UUID

    name: str

    description: str | None

    max_members: int

    owner_id: UUID

    hackathon_id: UUID | None = None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )