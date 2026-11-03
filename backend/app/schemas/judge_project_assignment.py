from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class JudgeProjectAssignmentCreate(BaseModel):
    judge_id: UUID
    project_id: UUID


class JudgeProjectAssignmentResponse(BaseModel):
    id: UUID
    judge_id: UUID
    project_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}