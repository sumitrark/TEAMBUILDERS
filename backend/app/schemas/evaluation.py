from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# CREATE / UPDATE EVALUATION
# ============================================================

class EvaluationCreate(BaseModel):

    project_id: UUID

    innovation_score: int = Field(
        ...,
        ge=1,
        le=10,
    )

    technical_score: int = Field(
        ...,
        ge=1,
        le=10,
    )

    impact_score: int = Field(
        ...,
        ge=1,
        le=10,
    )

    presentation_score: int = Field(
        ...,
        ge=1,
        le=10,
    )

    overall_score: int = Field(
        ...,
        ge=1,
        le=10,
    )

    feedback: str | None = Field(
        default=None,
        max_length=5000,
    )


# ============================================================
# EVALUATION RESPONSE
# ============================================================

class EvaluationResponse(BaseModel):

    id: UUID

    project_id: UUID

    judge_id: UUID

    innovation_score: int

    technical_score: int

    impact_score: int

    presentation_score: int

    overall_score: int

    feedback: str | None

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# PROJECT EVALUATION SUMMARY
# ============================================================

class EvaluationSummary(BaseModel):

    project_id: UUID

    total_evaluations: int

    average_innovation: float

    average_technical: float

    average_impact: float

    average_presentation: float

    average_overall: float