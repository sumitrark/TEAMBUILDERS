from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


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

    # Precise, timezone-aware lifecycle timestamps (optional - when
    # omitted, lifecycle status falls back to the date fields above
    # at day boundaries). New organizer UIs should always send these.
    registration_start: datetime | None = None
    registration_end: datetime | None = None
    hackathon_start: datetime | None = None
    hackathon_end: datetime | None = None

    banner_image: str = ""
    website: str = ""

    @model_validator(mode="after")
    def validate_lifecycle_ordering(self):
        if (
            self.registration_start
            and self.registration_end
            and self.registration_start >= self.registration_end
        ):
            raise ValueError(
                "registration_start must be before registration_end"
            )

        if (
            self.registration_end
            and self.hackathon_start
            and self.registration_end > self.hackathon_start
        ):
            raise ValueError(
                "registration_end must be at or before hackathon_start"
            )

        if (
            self.hackathon_start
            and self.hackathon_end
            and self.hackathon_start >= self.hackathon_end
        ):
            raise ValueError(
                "hackathon_start must be before hackathon_end"
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

    registration_start: datetime | None = None
    registration_end: datetime | None = None
    hackathon_start: datetime | None = None
    hackathon_end: datetime | None = None

    banner_image: str
    website: str

    status: str
    is_active: bool

    # Authoritative, server-computed lifecycle status - populated by
    # the route, not stored on the model. Optional so this schema
    # still works for any endpoint that hasn't been updated to
    # compute it yet.
    lifecycle_status: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )
