from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class WorkspaceHackathonInfo(BaseModel):
    id: UUID
    title: str
    description: str


class WorkspaceTeamInfo(BaseModel):
    id: UUID
    name: str


class WorkspaceTeamMember(BaseModel):
    user_id: UUID
    name: str
    email: str
    presence: str
    is_current_user: bool


class WorkspaceProjectInfo(BaseModel):
    id: UUID
    title: str
    status: str
    description: str | None = None
    tech_stack: str | None = None
    github_url: str | None = None
    demo_url: str | None = None
    ai_tools_used: str | None = None


class WorkspaceResponse(BaseModel):
    hackathon: WorkspaceHackathonInfo
    lifecycle_status: str
    seconds_remaining: int | None

    team: WorkspaceTeamInfo | None
    team_members: list[WorkspaceTeamMember]

    project: WorkspaceProjectInfo | None

    latest_submission_version: int | None
    submitted_at: datetime | None
    submission_count: int

    proctoring_strikes: int
    flagged_for_review: bool


class WorkspacePresenceResponse(BaseModel):
    status: str
    last_seen_at: datetime