
from uuid import UUID
from datetime import datetime

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    field_validator,
)

from app.constants.team_skills import get_canonical_skill


class TeamCreate(BaseModel):

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    max_members: int = Field(
        default=4,
        ge=2,
        le=10,
    )

    # Hackathon is selected later during registration.
    hackathon_id: UUID | None = None

    # Only skills from the shared catalogue are allowed.
    required_skills: list[str] = Field(
        default_factory=list,
        max_length=20,
    )

    @field_validator("required_skills")
    @classmethod
    def validate_required_skills(
        cls,
        skills: list[str],
    ) -> list[str]:

        canonical_skills = []

        for skill in skills:
            if not isinstance(skill, str) or not skill.strip():
                raise ValueError(
                    "Required skills must contain valid skill names"
                )

            canonical = get_canonical_skill(skill)

            if canonical is None:
                raise ValueError(
                    f"'{skill}' is not in the approved skill catalogue"
                )

            if canonical not in canonical_skills:
                canonical_skills.append(canonical)

        return canonical_skills


class TeamResponse(BaseModel):

    id: UUID

    name: str

    description: str | None

    max_members: int

    owner_id: UUID

    hackathon_id: UUID | None = None

    required_skills: list[str] = Field(
        default_factory=list,
    )

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
