from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.participant import router as participant_router
from app.core.config import settings
from app.api.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.team import router as team_router
from app.api.routes.project import router as project_router
from app.api.routes.team_member import router as team_member_router
from app.api.routes.profile import router as profile_router
from app.api.routes.settings import router as settings_router
from app.api.routes.hackathon import router as hackathon_router
from app.api.routes.team_invitation import (
    router as team_invitation_router,
)
from app.api.routes.achievement import router as achievement_router
from app.api.routes.help_center import (
    router as help_center_router,
)
from app.api.routes.matchmaker import (
    router as matchmaker_router,
)
from app.api.routes.content_generation import (
    router as content_generation_router,
)
from app.api.routes.notification import (
    router as notification_router,
)
from app.api.routes.user import router as user_router
print("✅ LOADED app/main.py WITH PARTICIPANT ROUTER")
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Routes
app.include_router(
    health_router,
    prefix=settings.API_V1_PREFIX,
)

# Authentication Routes
app.include_router(
    auth_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    hackathon_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    participant_router,
    prefix=settings.API_V1_PREFIX,
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to TEAMBUILDERS API"
    }


app.include_router(
    dashboard_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    team_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    team_member_router,
    prefix=settings.API_V1_PREFIX,
)



app.include_router(
    project_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    profile_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    settings_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    team_invitation_router,
    prefix="/api/v1",
)

app.include_router(
    user_router,
    prefix="/api/v1",
)

app.include_router(
    content_generation_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    matchmaker_router,
    prefix="/api/v1",
)

app.include_router(
    notification_router,
    prefix="/api/v1",
)

app.include_router(
    help_center_router,
    prefix="/api/v1",
)

app.include_router(
    achievement_router,
    prefix="/api/v1",
)

for route in app.router.routes:
    if hasattr(route, "path"):
        print(route.path)