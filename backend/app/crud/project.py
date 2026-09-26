from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.schemas.project import ProjectCreate
from app.services.achievement_service import award_achievement


# =========================================================
# CREATE PROJECT
# =========================================================

async def create_project(
    db: AsyncSession,
    owner_id: UUID,
    data: ProjectCreate,
):
    project = Project(
        title=data.title,
        description=data.description,
        tech_stack=data.tech_stack,
        github_url=data.github_url,
        demo_url=data.demo_url,
        team_id=data.team_id,
        owner_id=owner_id,
        ai_tools_used=data.ai_tools_used,
    )

    db.add(project)

    await db.commit()
    await db.refresh(project)

    # =====================================================
    # Award PROJECT_CREATOR
    # =====================================================

    await award_achievement(
        db=db,
        user_id=owner_id,
        code="PROJECT_CREATOR",
    )

    return project


# =========================================================
# GET MY PROJECTS
# =========================================================

async def get_my_projects(
    db: AsyncSession,
    owner_id: UUID,
):
    result = await db.execute(
        select(Project)
        .where(
            Project.owner_id == owner_id
        )
        .order_by(
            Project.created_at.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# GET PROJECT
# =========================================================

async def get_project(
    db: AsyncSession,
    project_id: UUID,
    owner_id: UUID,
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == owner_id,
        )
    )

    return result.scalar_one_or_none()


async def get_project_by_id(
    db: AsyncSession,
    project_id: UUID,
):
    """
    Unscoped lookup - for judges/organizers/AI features that need to
    read a project regardless of who owns it. Never use this for
    write operations; those must stay owner-scoped via get_project().
    """
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )

    return result.scalar_one_or_none()


# =========================================================
# UPDATE PROJECT
# =========================================================

async def update_project(
    db: AsyncSession,
    project_id: UUID,
    owner_id: UUID,
    data: ProjectCreate,
):
    project = await get_project(
        db,
        project_id,
        owner_id,
    )

    if project is None:
        return None

    if project.status in ("LOCKED", "UNDER_REVIEW", "EVALUATED", "WINNER"):
        return "PROJECT_LOCKED"

    # Server-side deadline enforcement: once the hackathon has
    # finished, ordinary edits are blocked even if the project's own
    # status hasn't been explicitly locked yet.
    if project.team_id:
        from app.models.team import Team
        from app.models.hackathon import Hackathon
        from app.services.hackathon_lifecycle import is_hackathon_finished

        team_result = await db.execute(
            select(Team).where(Team.id == project.team_id)
        )
        team = team_result.scalar_one_or_none()

        if team and team.hackathon_id:
            hackathon_result = await db.execute(
                select(Hackathon).where(Hackathon.id == team.hackathon_id)
            )
            hackathon = hackathon_result.scalar_one_or_none()

            if hackathon and is_hackathon_finished(hackathon):
                return "HACKATHON_FINISHED"

    project.title = data.title
    project.description = data.description
    project.tech_stack = data.tech_stack
    project.github_url = data.github_url
    project.demo_url = data.demo_url
    project.team_id = data.team_id
    project.ai_tools_used = data.ai_tools_used

    await db.commit()
    await db.refresh(project)

    return project


# =========================================================
# DELETE PROJECT
# =========================================================

async def delete_project(
    db: AsyncSession,
    project_id: UUID,
    owner_id: UUID,
):
    project = await get_project(
        db,
        project_id,
        owner_id,
    )

    if project is None:
        return False

    await db.delete(project)

    await db.commit()

    return True