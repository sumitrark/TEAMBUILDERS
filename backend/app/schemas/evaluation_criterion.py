from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EvaluationCriterionCreate(BaseModel):
    key: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    name: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    max_score: int = Field(
        default=10,
        ge=1,
        le=1000,
    )

    weight: int = Field(
        default=0,
        ge=0,
        le=100,
    )

    display_order: int = Field(
        default=0,
        ge=0,
    )

    is_active: bool = True


class EvaluationCriterionUpdate(BaseModel):
    key: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    max_score: int | None = Field(
        default=None,
        ge=1,
        le=1000,
    )

    weight: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    display_order: int | None = Field(
        default=None,
        ge=0,
    )

    is_active: bool | None = None


class EvaluationCriterionResponse(BaseModel):
    id: UUID
    hackathon_id: UUID
    key: str
    name: str
    description: str | None
    max_score: int
    weight: int
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )