
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class HackathonCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    organizer: str = ""

    mode: str
    location: str
    team_size: int = Field(ge=2, le=20)

    difficulty: str
    prize_pool: str

    # Legacy date fields are optional.
    registration_deadline: date | None = None
    start_date: date | None = None
    end_date: date | None = None

    # New lifecycle datetime fields.
    registration_start: datetime | None = None
    registration_end: datetime | None = None
    hackathon_start: datetime | None = None
    hackathon_end: datetime | None = None

    banner_image: str = ""
    website: str = ""

    @model_validator(mode="after")
    def validate_lifecycle_ordering(self):
        if (
            self.start_date
            and self.end_date
            and self.start_date > self.end_date
        ):
            raise ValueError(
                "Start date must be before or equal to end date"
            )

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

        if (
            self.hackathon_start
            and self.start_date
            and self.hackathon_start.date() != self.start_date
        ):
            raise ValueError(
                "Hackathon start date must match start_date"
            )

        if (
            self.hackathon_end
            and self.end_date
            and self.hackathon_end.date() != self.end_date
        ):
            raise ValueError(
                "Hackathon end date must match end_date"
            )

        return self


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

    # Legacy date fields.
    registration_deadline: date | None = None
    start_date: date | None = None
    end_date: date | None = None

    # New lifecycle datetime fields.
    registration_start: datetime | None = None
    registration_end: datetime | None = None
    hackathon_start: datetime | None = None
    hackathon_end: datetime | None = None

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

    # Legacy fields.
    registration_deadline: date | None = None
    start_date: date | None = None
    end_date: date | None = None

    # Lifecycle datetime fields.
    registration_start: datetime | None = None
    registration_end: datetime | None = None
    hackathon_start: datetime | None = None
    hackathon_end: datetime | None = None

    banner_image: str
    website: str

    status: str
    is_active: bool

    lifecycle_status: str | None = None

    model_config = ConfigDict(from_attributes=True)
