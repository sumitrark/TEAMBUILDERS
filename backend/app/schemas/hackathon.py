
from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


ParticipationMode = Literal["individual", "team", "both"]


class HackathonCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)

    organizer: str = ""

    mode: str
    participation_mode: ParticipationMode = "both"
    location: str

    team_size: int = Field(ge=2, le=20)

    difficulty: str
    prize_pool: str

    # Canonical date-only fields
    registration_deadline: date
    start_date: date
    end_date: date

    # Optional precise lifecycle timestamps
    registration_start: datetime | None = None
    registration_end: datetime | None = None
    hackathon_start: datetime | None = None
    hackathon_end: datetime | None = None

    banner_image: str = ""
    website: str = ""

    @model_validator(mode="after")
    def validate_dates(self):
        if self.registration_deadline > self.start_date:
            raise ValueError(
                "Registration deadline cannot be after hackathon start date"
            )

        if self.start_date > self.end_date:
            raise ValueError(
                "Hackathon end date cannot be before start date"
            )

        if (
            self.registration_start
            and self.registration_end
            and self.registration_start > self.registration_end
        ):
            raise ValueError(
                "Registration start cannot be after registration end"
            )

        if (
            self.hackathon_start
            and self.hackathon_end
            and self.hackathon_start > self.hackathon_end
        ):
            raise ValueError(
                "Hackathon start cannot be after hackathon end"
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
    participation_mode: ParticipationMode | None = None
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

    registration_start: datetime | None = None
    registration_end: datetime | None = None
    hackathon_start: datetime | None = None
    hackathon_end: datetime | None = None

    banner_image: str | None = None
    website: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.registration_deadline is not None
            and self.start_date is not None
            and self.registration_deadline > self.start_date
        ):
            raise ValueError(
                "Registration deadline cannot be after hackathon start date"
            )

        if (
            self.start_date is not None
            and self.end_date is not None
            and self.start_date > self.end_date
        ):
            raise ValueError(
                "Hackathon end date cannot be before start date"
            )

        if (
            self.registration_start is not None
            and self.registration_end is not None
            and self.registration_start > self.registration_end
        ):
            raise ValueError(
                "Registration start cannot be after registration end"
            )

        if (
            self.hackathon_start is not None
            and self.hackathon_end is not None
            and self.hackathon_start > self.hackathon_end
        ):
            raise ValueError(
                "Hackathon start cannot be after hackathon end"
            )

        return self


class HackathonResponse(BaseModel):
    id: UUID
    organizer_id: UUID | None

    title: str
    description: str
    organizer: str

    mode: str
    participation_mode: ParticipationMode = "both"
    location: str
    team_size: int
    difficulty: str
    prize_pool: str

    # Date-only fields
    registration_deadline: date | None = None
    start_date: date | None = None
    end_date: date | None = None

    # Lifecycle timestamps
    registration_start: datetime | None = None
    registration_end: datetime | None = None
    hackathon_start: datetime | None = None
    hackathon_end: datetime | None = None

    banner_image: str
    website: str

    status: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

