from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    action_url: str | None = None
    is_read: bool
    created_at: datetime