from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AchievementResponse(BaseModel):
    id: UUID
    user_id: UUID
    code: str
    title: str
    description: str
    icon: str
    earned_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )