from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


class WorkspaceHackathonInfo(BaseModel):
    id: UUID
    title: str
    description: str


class WorkspaceTeamInfo(BaseModel):
    id: UUID
    name: str


class WorkspaceProjectInfo(BaseModel):
    id: UUID
    title: str
    status: str


class WorkspaceResponse(BaseModel):
    hackathon: WorkspaceHackathonInfo
    lifecycle_status: str
    seconds_remaining: int | None
    team: WorkspaceTeamInfo | None
    project: WorkspaceProjectInfo | None
    latest_submission_version: int | None
    submitted_at: datetime | None
    proctoring_strikes: int
    flagged_for_review: bool
