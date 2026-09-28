from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.hackathon import Hackathon
from app.models.submission import Submission
from app.crud.notification import create_notification
from app.services.hackathon_lifecycle import (
    get_hackathon_status,
    is_submission_open,
)


async def _get_project_team_hackathon(db: AsyncSession, project_id: UUID):
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if project is None:
        return None, None, None

    team = None
    if project.team_id:
        team_result = await db.execute(
            select(Team).where(Team.id == project.team_id)
        )
        team = team_result.scalar_one_or_none()

    hackathon = None
    if team and team.hackathon_id:
        hackathon_result = await db.execute(
            select(Hackathon).where(Hackathon.id == team.hackathon_id)
        )
        hackathon = hackathon_result.scalar_one_or_none()

    return project, team, hackathon


async def _user_can_edit_project(
    db: AsyncSession, user_id: UUID, project: Project, team: Team | None
) -> bool:
    if project.owner_id == user_id:
        return True

    if team:
        result = await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team.id,
                TeamMember.user_id == user_id,
            )
        )
        if result.scalar_one_or_none():
            return True

    return False


async def submit_project(
    db: AsyncSession,
    user_id: UUID,
    project_id: UUID,
):
    project, team, hackathon = await _get_project_team_hackathon(
        db, project_id
    )

    if project is None:
        return "PROJECT_NOT_FOUND"

    if team is None:
        return "PROJECT_HAS_NO_TEAM"

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    if not await _user_can_edit_project(db, user_id, project, team):
        return "NOT_AUTHORIZED"

    # --------------------------------------------------------
    # Server-side deadline enforcement - the authoritative check.
    # A manipulated frontend request cannot bypass this.
    # --------------------------------------------------------

    if not is_submission_open(hackathon):
        lifecycle_status = get_hackathon_status(hackathon)

        if lifecycle_status in (
            "DRAFT",
            "UPCOMING",
            "REGISTRATION_OPEN",
            "REGISTRATION_CLOSED",
        ):
            return "HACKATHON_NOT_STARTED"

        return "SUBMISSION_WINDOW_CLOSED"

    if project.status in ("LOCKED", "UNDER_REVIEW", "EVALUATED", "WINNER"):
        return "PROJECT_LOCKED"

    # --------------------------------------------------------
    # Create the frozen snapshot (this IS the version history -
    # each submit is a new row with an incrementing version)
    # --------------------------------------------------------

    count_result = await db.execute(
        select(func.count()).select_from(Submission).where(
            Submission.project_id == project_id
        )
    )
    next_version = count_result.scalar_one() + 1

    submission = Submission(
        project_id=project.id,
        team_id=team.id,
        hackathon_id=hackathon.id,
        submitted_by=user_id,
        version_number=next_version,
        title=project.title,
        description=project.description,
        technologies=project.tech_stack,
        repository_url=project.github_url,
        demo_url=project.demo_url,
        presentation_url=None,
        ai_tools_used=project.ai_tools_used,
    )

    db.add(submission)

    project.status = "SUBMITTED"

    await db.flush()

    await create_notification(
        db=db,
        user_id=user_id,
        notification_type="SUBMISSION_SUCCESS",
        title="Project Submitted",
        message=(
            f"Your project '{project.title}' was submitted "
            f"successfully."
        ),
        action_url=f"/dashboard/hackathons/{hackathon.id}/workspace",
    )

    await db.commit()
    await db.refresh(submission)

    return submission


async def get_project_submission_status(
    db: AsyncSession,
    user_id: UUID,
    project_id: UUID,
):
    project, team, hackathon = await _get_project_team_hackathon(
        db, project_id
    )

    if project is None:
        return "PROJECT_NOT_FOUND"

    if not await _user_can_edit_project(db, user_id, project, team):
        return "NOT_AUTHORIZED"

    result = await db.execute(
        select(Submission)
        .where(Submission.project_id == project_id)
        .order_by(Submission.version_number.desc())
    )
    submissions = result.scalars().all()

    latest = submissions[0] if submissions else None

    can_edit = project.status in ("DRAFT", "SUBMITTED")
    can_submit = can_edit

    if hackathon is not None:
        can_edit = can_edit and not (
            get_hackathon_status(hackathon) == "COMPLETED"
        )
        can_submit = can_submit and is_submission_open(hackathon)
    else:
        can_submit = False

    return {
        "project_id": project.id,
        "status": project.status,
        "latest_submission": latest,
        "submission_count": len(submissions),
        "can_edit": can_edit,
        "can_submit": can_submit,
    }

