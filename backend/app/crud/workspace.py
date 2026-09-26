from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hackathon import Hackathon
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.project import Project
from app.models.submission import Submission
from app.models.participant import Participant
from app.services.hackathon_lifecycle import (
    get_hackathon_status,
    get_time_remaining_seconds,
)


async def get_workspace(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
):
    hackathon_result = await db.execute(
        select(Hackathon).where(Hackathon.id == hackathon_id)
    )
    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    participant_result = await db.execute(
        select(Participant).where(
            Participant.hackathon_id == hackathon_id,
            Participant.user_id == user_id,
        )
    )
    participant = participant_result.scalar_one_or_none()

    if participant is None:
        return "NOT_REGISTERED"

    # --------------------------------------------------------
    # Team (if any) - a participant may not have joined/created a
    # team yet, which is a normal, valid state, not an error.
    # --------------------------------------------------------

    team_member_result = await db.execute(
        select(TeamMember, Team)
        .join(Team, TeamMember.team_id == Team.id)
        .where(
            TeamMember.user_id == user_id,
            Team.hackathon_id == hackathon_id,
        )
    )
    row = team_member_result.first()
    team = row[1] if row else None

    # Fall back to a team the user owns directly, in case they
    # created one but the membership row uses a different pattern.
    if team is None:
        owned_result = await db.execute(
            select(Team).where(
                Team.hackathon_id == hackathon_id,
                Team.owner_id == user_id,
            )
        )
        team = owned_result.scalar_one_or_none()

    # --------------------------------------------------------
    # Project + latest submission
    # --------------------------------------------------------

    project = None
    latest_submission = None

    if team is not None:
        project_result = await db.execute(
            select(Project).where(Project.team_id == team.id)
        )
        project = project_result.scalar_one_or_none()

        if project is not None:
            submission_result = await db.execute(
                select(Submission)
                .where(Submission.project_id == project.id)
                .order_by(Submission.version_number.desc())
            )
            latest_submission = submission_result.scalars().first()

    return {
        "hackathon": {
            "id": hackathon.id,
            "title": hackathon.title,
            "description": hackathon.description,
        },
        "lifecycle_status": get_hackathon_status(hackathon),
        "seconds_remaining": get_time_remaining_seconds(hackathon),
        "team": (
            {"id": team.id, "name": team.name} if team else None
        ),
        "project": (
            {
                "id": project.id,
                "title": project.title,
                "status": project.status,
            }
            if project
            else None
        ),
        "latest_submission_version": (
            latest_submission.version_number if latest_submission else None
        ),
        "submitted_at": (
            latest_submission.submitted_at if latest_submission else None
        ),
        "proctoring_strikes": participant.proctoring_strikes,
        "flagged_for_review": participant.flagged_for_review,
    }
