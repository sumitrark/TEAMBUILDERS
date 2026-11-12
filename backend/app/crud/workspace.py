from app.models.team_hackathon import TeamHackathon
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hackathon import Hackathon
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.project import Project
from app.models.submission import Submission
from app.models.participant import Participant
from app.models.user import User

from app.services.hackathon_lifecycle import (
    get_hackathon_status,
    get_time_remaining_seconds,
)


def _presence_status(last_seen_at: datetime | None) -> str:
    if last_seen_at is None:
        return "OFFLINE"

    now = datetime.now(timezone.utc)

    if last_seen_at.tzinfo is None:
        last_seen_at = last_seen_at.replace(tzinfo=timezone.utc)

    seconds = (now - last_seen_at).total_seconds()

    if seconds <= 45:
        return "ONLINE"

    if seconds <= 300:
        return "AWAY"

    return "OFFLINE"


async def get_workspace(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
):
    # --------------------------------------------------------
    # HACKATHON
    # --------------------------------------------------------

    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    # --------------------------------------------------------
    # PARTICIPANT
    # --------------------------------------------------------

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
    # RESOLVE THE PARTICIPANT'S REGISTERED TEAM
    # --------------------------------------------------------

    team = None

    if participant.team_id is not None:
        # A participant with a team_id must belong to a team
        # registered for this hackathon.
        team_result = await db.execute(
            select(Team).where(
                Team.id == participant.team_id,
                Team.hackathon_id == hackathon_id,
            )
        )
        team = team_result.scalar_one_or_none()

        if team is None:
            return "TEAM_REGISTRATION_NOT_FOUND"

        # Confirm that the team registration exists.
        registration_result = await db.execute(
            select(TeamHackathon.id).where(
                TeamHackathon.team_id == team.id,
                TeamHackathon.hackathon_id == hackathon_id,
            )
        )

        if registration_result.scalar_one_or_none() is None:
            return "TEAM_REGISTRATION_NOT_FOUND"

        # Confirm the participant is actually the owner or a member.
        is_owner = team.owner_id == user_id

        membership_result = await db.execute(
            select(TeamMember.id).where(
                TeamMember.team_id == team.id,
                TeamMember.user_id == user_id,
            )
        )
        is_member = membership_result.scalar_one_or_none() is not None

        if not is_owner and not is_member:
            return "NOT_REGISTERED"

    else:
        # Support existing registered team memberships where the
        # participant's team_id has not been populated.
        membership_result = await db.execute(
            select(Team)
            .join(TeamMember, TeamMember.team_id == Team.id)
            .join(
                TeamHackathon,
                TeamHackathon.team_id == Team.id,
            )
            .where(
                TeamMember.user_id == user_id,
                Team.hackathon_id == hackathon_id,
                TeamHackathon.hackathon_id == hackathon_id,
            )
        )

        member_teams = membership_result.scalars().all()

        if len(member_teams) > 1:
            return "MULTIPLE_TEAM_REGISTRATIONS"

        if member_teams:
            team = member_teams[0]

        else:
            # Check whether the participant owns a registered team.
            owned_result = await db.execute(
                select(Team)
                .join(
                    TeamHackathon,
                    TeamHackathon.team_id == Team.id,
                )
                .where(
                    Team.owner_id == user_id,
                    Team.hackathon_id == hackathon_id,
                    TeamHackathon.hackathon_id == hackathon_id,
                )
            )

            owned_teams = owned_result.scalars().all()

            if len(owned_teams) > 1:
                return "MULTIPLE_TEAM_REGISTRATIONS"

            if owned_teams:
                team = owned_teams[0]

    # IMPORTANT:
    # If team is None, this is an individual participant.
    # Do not create a Team, TeamMember, or TeamHackathon record.


    # --------------------------------------------------------
    # FIND PROJECT
    # --------------------------------------------------------

    project = None

    if team is not None:
        project_result = await db.execute(
            select(Project)
            .where(Project.team_id == team.id)
            .order_by(Project.created_at.desc())
        )

        project = project_result.scalars().first()

    # Solo project fallback.
    # Only retrieve an unassigned project owned by this participant.
    if project is None:
        solo_project_result = await db.execute(
            select(Project)
            .where(
                Project.owner_id == user_id,
                Project.team_id.is_(None),
            )
            .order_by(Project.created_at.desc())
        )

        project = solo_project_result.scalars().first()

    # --------------------------------------------------------
    # SUBMISSIONS
    # --------------------------------------------------------

    latest_submission = None
    submission_count = 0

    if project is not None:
        submission_result = await db.execute(
            select(Submission)
            .where(
                Submission.project_id == project.id
            )
            .order_by(
                Submission.version_number.desc()
            )
        )

        submissions = submission_result.scalars().all()

        latest_submission = (
            submissions[0] if submissions else None
        )

        submission_count = len(submissions)

    
    # --------------------------------------------------------
    # TEAM MEMBERS (INCLUDE OWNER)
    # --------------------------------------------------------

    team_members = []

    if team is not None:
        # Start with the owner, even if there is no TeamMember row.
        member_user_ids = {team.owner_id}

        membership_result = await db.execute(
            select(TeamMember.user_id).where(
                TeamMember.team_id == team.id
            )
        )

        member_user_ids.update(
            membership_result.scalars().all()
        )

        # Only show users who are registered participants
        # in this hackathon.
        members_result = await db.execute(
            select(User, Participant)
            .join(
                Participant,
                Participant.user_id == User.id,
            )
            .where(
                User.id.in_(member_user_ids),
                Participant.hackathon_id == hackathon_id,
            )
            .order_by(
                User.full_name.asc(),
                User.email.asc(),
            )
        )

        for user, member_participant in members_result.all():
            team_members.append(
                {
                    "user_id": user.id,
                    "name": user.full_name or user.email,
                    "email": user.email,
                    "presence": _presence_status(
                        member_participant.last_seen_at
                    ),
                    "is_current_user": user.id == user_id,
                }
            )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "hackathon": {
            "id": hackathon.id,
            "title": hackathon.title,
            "description": hackathon.description,
        },

        "lifecycle_status": get_hackathon_status(hackathon),

        "seconds_remaining": get_time_remaining_seconds(
            hackathon
        ),

        "team": (
            {
                "id": team.id,
                "name": team.name,
            }
            if team
            else None
        ),

        "team_members": team_members,

        "project": (
            {
                "id": project.id,
                "title": project.title,
                "status": project.status,
                "description": project.description,
                "tech_stack": project.tech_stack,
                "github_url": project.github_url,
                "demo_url": project.demo_url,
                "ai_tools_used": project.ai_tools_used,
            }
            if project
            else None
        ),

        "latest_submission_version": (
            latest_submission.version_number
            if latest_submission
            else None
        ),

        "submitted_at": (
            latest_submission.submitted_at
            if latest_submission
            else None
        ),

        "submission_count": submission_count,

        "proctoring_strikes": participant.proctoring_strikes,

        "flagged_for_review": participant.flagged_for_review,
    }


async def update_workspace_presence(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
):
    result = await db.execute(
        select(Participant).where(
            Participant.user_id == user_id,
            Participant.hackathon_id == hackathon_id,
        )
    )

    participant = result.scalar_one_or_none()

    if participant is None:
        return "NOT_REGISTERED"

    participant.last_seen_at = datetime.now(timezone.utc)

    await db.commit()

    return {
        "status": "ONLINE",
        "last_seen_at": participant.last_seen_at,
    }
