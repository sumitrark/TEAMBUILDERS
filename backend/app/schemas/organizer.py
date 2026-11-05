
from uuid import UUID
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


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

    # Legacy date fields
    registration_deadline: date | None = None
    start_date: date | None = None
    end_date: date | None = None

    # Lifecycle datetime fields
    registration_start: datetime | None = None
    registration_end: datetime | None = None
    hackathon_start: datetime | None = None
    hackathon_end: datetime | None = None

    banner_image: str
    website: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class OrganizerStatsResponse(BaseModel):
    hackathons: int
    participants: int
    teams: int
    projects: int


class OrganizerHackathonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = None
    mode: str | None = None
    location: str | None = None
    team_size: int | None = Field(default=None, ge=2, le=20)
    difficulty: str | None = None
    prize_pool: str | None = None

    # Legacy date fields
    registration_deadline: date | None = None
    start_date: date | None = None
    end_date: date | None = None

    # Lifecycle datetime fields
    registration_start: datetime | None = None
    registration_end: datetime | None = None
    hackathon_start: datetime | None = None
    hackathon_end: datetime | None = None

    banner_image: str | None = None
    website: str | None = None

    @model_validator(mode="after")
    def validate_lifecycle_ordering(self):
        if (
            self.registration_start
            and self.registration_end
            and self.registration_start >= self.registration_end
        ):
            raise ValueError(
                "Registration start must be before registration end"
            )

        if (
            self.registration_end
            and self.hackathon_start
            and self.registration_end > self.hackathon_start
        ):
            raise ValueError(
                "Registration must end before or when the hackathon starts"
            )

        if (
            self.hackathon_start
            and self.hackathon_end
            and self.hackathon_start >= self.hackathon_end
        ):
            raise ValueError(
                "Hackathon start must be before hackathon end"
            )

        return self
