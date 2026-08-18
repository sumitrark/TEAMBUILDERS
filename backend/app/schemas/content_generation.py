from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ContentGenerationCreate(BaseModel):

    project_id: UUID | None = None

    platform: str = Field(
        ...,
        min_length=2,
        max_length=30,
    )

    content_type: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )

    tone: str = Field(
        ...,
        min_length=2,
        max_length=30,
    )

    prompt: str | None = Field(
        default=None,
        max_length=5000,
    )


class ContentGenerationResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID

    user_id: UUID

    project_id: UUID | None

    platform: str

    content_type: str

    tone: str

    prompt: str | None

    generated_content: str

    status: str

    created_at: datetime

    updated_at: datetime