from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):
    title: str
    description: str | None = None
    tech_stack: str | None = None
    github_url: str | None = None
    demo_url: str | None = None
    team_id: UUID | None = None


class ProjectResponse(BaseModel):
    id: UUID
    title: str
    description: str | None
    tech_stack: str | None
    github_url: str | None
    demo_url: str | None
    owner_id: UUID
    team_id: UUID | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )