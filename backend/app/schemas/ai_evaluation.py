from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AiEvaluationResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: UUID

    project_id: UUID

    # Always surfaced explicitly so clients can label this in the UI
    # and never present it as a human judge's score.
    ai_assisted: bool = True

    innovation_score: int
    technical_score: int
    impact_score: int
    feasibility_score: int
    overall_score: int

    ui_ux_notes: str | None

    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]
    potential_issues: list[str]

    model_name: str

    created_at: datetime
    updated_at: datetime
