from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HackathonCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)

    # Kept for compatibility with existing participant UI.
    # Organizer API will automatically populate this.
    organizer: str = ""

    mode: str
    location: str

    team_size: int = Field(
        ge=2,
        le=20,
    )

    difficulty: str
    prize_pool: str

    registration_deadline: date
    start_date: date
    end_date: date

    banner_image: str = ""
    website: str = ""


class HackathonUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=200,
    )

    description: str | None = None
    mode: str | None = None
    location: str | None = None
    team_size: int | None = Field(
        default=None,
        ge=2,
        le=20,
    )

    difficulty: str | None = None
    prize_pool: str | None = None

    registration_deadline: date | None = None
    start_date: date | None = None
    end_date: date | None = None

    banner_image: str | None = None
    website: str | None = None


class HackathonResponse(BaseModel):
    id: UUID

    organizer_id: UUID | None

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
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True
    )