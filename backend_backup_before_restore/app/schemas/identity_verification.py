from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class IdentityVerificationResponse(BaseModel):
    id: UUID
    provider: str
    provider_reference: str | None
    status: str
    verified_at: datetime | None
    expires_at: datetime | None

    model_config = {"from_attributes": True}

