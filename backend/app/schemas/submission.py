from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SubmissionResponse(BaseModel):
    id: UUID
    project_id: UUID
    team_id: UUID | None
    hackathon_id: UUID
    status: str
    version_number: int
    title: str
    description: str | None
    technologies: str | None
    repository_url: str | None
    demo_url: str | None
    presentation_url: str | None
    ai_tools_used: str | None
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectStatusResponse(BaseModel):
    project_id: UUID
    status: str
    latest_submission: SubmissionResponse | None
    submission_count: int
    can_edit: bool
    can_submit: bool
