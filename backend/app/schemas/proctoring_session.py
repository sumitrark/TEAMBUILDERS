from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProctoringSessionStart(BaseModel):
    hackathon_id: UUID


class ProctoringSessionResponse(BaseModel):
    id: UUID
    hackathon_id: UUID
    started_at: datetime
    last_heartbeat_at: datetime
    ended_at: datetime | None = None
    end_reason: str | None = None
    active: bool

    model_config = {"from_attributes": True}


class ProctoringSessionStop(BaseModel):
    end_reason: str = Field(
        default="CAMERA_STOPPED",
        pattern=r"^(CAMERA_STOPPED|PAGE_CLOSED|NAVIGATED_AWAY|SESSION_RESTARTED|ERROR|MANUAL)$",
    )