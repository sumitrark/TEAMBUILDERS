from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user

from app.models.hackathon import Hackathon
from app.models.participant import Participant
from app.models.project import Project
from app.models.team_member import TeamMember


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Total available hackathons
    hackathons = await db.scalar(
        select(func.count(Hackathon.id))
    )

    # Hackathons joined by the current user
    my_participations = await db.scalar(
        select(func.count(Participant.id))
        .where(
            Participant.user_id == current_user.id
        )
    )

    # Projects owned by the current user
    projects = await db.scalar(
        select(func.count(Project.id))
        .where(
            Project.owner_id == current_user.id
        )
    )

    # Teams the current user belongs to
    teams = await db.scalar(
        select(func.count(TeamMember.id))
        .where(
            TeamMember.user_id == current_user.id
        )
    )

    return {
        "hackathons": hackathons or 0,
        "participants": my_participations or 0,
        "projects": projects or 0,
        "teams": teams or 0,
    }