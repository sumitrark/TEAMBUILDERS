from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class EvaluationCreate(BaseModel):
    project_id: UUID

    innovation_score: int = Field(..., ge=1, le=10)
    technical_score: int = Field(..., ge=1, le=10)
    impact_score: int = Field(..., ge=1, le=10)
    presentation_score: int = Field(..., ge=1, le=10)
    overall_score: int = Field(..., ge=1, le=10)

    criterion_scores: dict[str, int] | None = None

    feedback: str | None = None


class EvaluationResponse(BaseModel):
    id: UUID
    project_id: UUID
    judge_id: UUID

    innovation_score: int
    technical_score: int
    impact_score: int
    presentation_score: int
    overall_score: int

    criterion_scores: dict[str, int] | None = None

    feedback: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EvaluationSummary(BaseModel):
    project_id: UUID
    evaluation_count: int

    average_innovation: float
    average_technical: float
    average_impact: float
    average_presentation: float
    average_overall: float

    total_score: float
