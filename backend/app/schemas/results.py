from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ResultsAnnouncementRequest(BaseModel):
    announcement_at: datetime


class ResultsAnnouncementResponse(BaseModel):
    hackathon_id: UUID
    announcement_at: datetime | None
    published: bool