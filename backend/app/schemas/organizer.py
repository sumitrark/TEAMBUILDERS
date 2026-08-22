from uuid import UUID
from datetime import date

from pydantic import BaseModel


class OrganizerHackathonResponse(BaseModel):
    id: UUID
    title: str
    description: str
    organizer: str
    mode: str
    location: str
    team_size: int
    difficulty: str
    prize_pool: str
    registration_deadline: str
    start_date: str
    end_date: str
    banner_image: str
    website: str
    status: str

    model_config = {
        "from_attributes": True
    }


class OrganizerStatsResponse(BaseModel):
    hackathons: int
    participants: int
    teams: int
    projects: int


class OrganizerHackathonUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    mode: str | None = None
    location: str | None = None
    team_size: int | None = None
    difficulty: str | None = None
    prize_pool: str | None = None
    registration_deadline: date | None = None
    start_date: date | None = None
    end_date: date | None = None
    banner_image: str | None = None
    website: str | None = None