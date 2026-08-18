from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MatchRecommendation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    full_name: str
    username: str | None = None
    college: str
    course: str
    year: int

    bio: str | None = None

    skills: list[str] = []
    preferred_roles: list[str] = []

    match_score: float

    matched_skills: list[str] = []
    matched_roles: list[str] = []


class MatchmakerResponse(BaseModel):
    recommendations: list[MatchRecommendation]