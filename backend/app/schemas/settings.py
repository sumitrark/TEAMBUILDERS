from pydantic import BaseModel, Field


class SettingsResponse(BaseModel):
    team_invitations: bool
    hackathon_reminders: bool
    ai_recommendations: bool
    profile_visibility: str


class SettingsUpdate(BaseModel):
    team_invitations: bool = True
    hackathon_reminders: bool = True
    ai_recommendations: bool = True

    profile_visibility: str = Field(
        default="public",
        pattern="^(public|team_only|private)$",
    )