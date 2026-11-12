
from uuid import UUID

from pydantic import BaseModel, Field


class TeamMatchRecommendation(BaseModel):
    user_id: UUID
    full_name: str | None = None
    username: str | None = None
    college: str | None = None
    course: str | None = None
    year: int | None = None
    bio: str | None = None

    skills: list[str] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)

    match_score: float


class TeamMatchmakerResponse(BaseModel):
    team_id: UUID
    team_name: str
    required_skills: list[str]
    covered_skills: list[str]
    missing_skills: list[str]
    recommendations: list[TeamMatchRecommendation]
