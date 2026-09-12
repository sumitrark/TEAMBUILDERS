from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# JUDGE INVITATION
# ============================================================

class JudgeInviteRequest(BaseModel):
    email: str


class JudgeAcceptRequest(BaseModel):
    invitation_code: str


class MyJudgeHackathonResponse(BaseModel):
    hackathon_id: UUID
    title: str
    description: str | None
    status: str
    total_projects: int
    evaluated_count: int
    pending_count: int


class JudgeResponse(BaseModel):
    id: UUID
    hackathon_id: UUID
    user_id: UUID
    status: str

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# JUDGE PROJECT
# ============================================================

class JudgeProjectResponse(BaseModel):
    id: UUID
    title: str
    description: str | None
    tech_stack: str | None
    github_url: str | None
    demo_url: str | None
    team_id: UUID | None
    ai_tools_used: str | None

    # Anonymized team identifier only - never the real team name or
    # any member identity. Judges evaluate work, not who submitted
    # it, to reduce bias.
    team_display_id: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# JUDGE PROJECT LIST
# ============================================================

class JudgeProjectListResponse(BaseModel):
    projects: list[JudgeProjectResponse]
    total: int


# ============================================================
# JUDGE STATUS
# ============================================================

class JudgeStatusResponse(BaseModel):
    hackathon_id: UUID
    user_id: UUID
    status: str


# ============================================================
# PENDING INVITATIONS
# ============================================================

class JudgePendingInvitationResponse(BaseModel):
    judge_id: UUID
    hackathon_id: UUID
    hackathon_title: str
    status: str
    created_at: datetime