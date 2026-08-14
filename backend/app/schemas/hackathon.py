from datetime import date
from uuid import UUID

from pydantic import BaseModel


class HackathonCreate(BaseModel):
    title: str
    description: str
    organizer: str
    mode: str
    location: str
    team_size: int
    difficulty: str
    prize_pool: str
    registration_deadline: date
    start_date: date
    end_date: date
    banner_image: str = ""
    website: str = ""


class HackathonResponse(BaseModel):
    id: UUID
    title: str
    description: str
    organizer: str
    mode: str
    location: str
    team_size: int
    difficulty: str
    prize_pool: str
    registration_deadline: date
    start_date: date
    end_date: date
    banner_image: str
    website: str
    status: str

    model_config = {
        "from_attributes": True
    }