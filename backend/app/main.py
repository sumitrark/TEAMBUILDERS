from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.participant import router as participant_router
from app.core.config import settings
from app.api.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.hackathon import router as hackathon_router
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