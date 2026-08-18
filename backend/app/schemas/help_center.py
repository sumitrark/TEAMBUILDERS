from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HelpCenterQuestion(BaseModel):
    question: str


class HelpCenterResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    user_id: UUID
    question: str
    answer: str
    category: str
    created_at: datetime


class HelpCenterChatResponse(BaseModel):
    id: UUID
    question: str
    answer: str
    category: str
    created_at: datetime