from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FaceReferencePhotoResponse(BaseModel):
    user_id: UUID
    photo_data_url: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class FaceReferencePhotoUpdate(BaseModel):
    photo_data_url: str
