from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class ProctoringEventCreate(BaseModel):
    hackathon_id: UUID

    # "check_in" | "periodic_snapshot"
    event_type: str = Field(pattern="^(check_in|periodic_snapshot)$")

    # Determined client-side by the browser's own face detection.
    # The backend trusts and records this - it cannot independently
    # verify what happened in someone else's browser.
    face_detected: bool
    face_match_status: str | None = None
    face_similarity: float | None = None

    # Optional small thumbnail (data URL), capped client-side.
    snapshot_data_url: str | None = Field(default=None, max_length=300_000)


class ProctoringEventResponse(BaseModel):
    strike_count: int
    strike_threshold: int
    newly_flagged_for_review: bool
    message: str


class MyProctoringStatusResponse(BaseModel):
    strike_count: int
    strike_threshold: int
    flagged_for_review: bool


class FlaggedEventSummary(BaseModel):
    id: UUID
    event_type: str
    snapshot_data_url: str | None
    created_at: datetime


class FlaggedParticipantResponse(BaseModel):
    user_id: UUID
    full_name: str
    email: str
    strike_count: int
    recent_flagged_events: list[FlaggedEventSummary]

class ProctoringMonitorEvent(BaseModel):
    id: UUID
    event_type: str
    face_detected: bool
    snapshot_data_url: str | None
    created_at: datetime


class ProctoringMonitorParticipantResponse(BaseModel):
    user_id: UUID
    full_name: str
    email: str
    team_id: UUID | None
    identity_status: str
    strike_count: int
    flagged_for_review: bool
    last_check_at: datetime | None
    last_face_detected: bool | None
    recent_events: list[ProctoringMonitorEvent]

