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
    # RESOLVE OR CREATE THE PARTICIPANT'S TEAM
    # --------------------------------------------------------

    team = None

    # First check the participant's registered team.
    if participant.team_id:
        team_result = await db.execute(
            select(Team).where(
                Team.id == participant.team_id,
                Team.hackathon_id == hackathon_id,
            )
        )
        team = team_result.scalar_one_or_none()

    # Check TeamMember records.
    if team is None:
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

    # Check teams owned by the participant.
    if team is None:
        owned_result = await db.execute(
            select(Team).where(
                Team.hackathon_id == hackathon_id,
                Team.owner_id == user_id,
            )
        )
        team = owned_result.scalar_one_or_none()

    # --------------------------------------------------------
    # FIND EXISTING SOLO PROJECT
    # --------------------------------------------------------

    solo_project = None

    if team is None:
        solo_result = await db.execute(
            select(Project)
            .where(
                Project.owner_id == user_id,
                Project.team_id.is_(None),
            )
            .order_by(Project.created_at.desc())
        )

        solo_project = solo_result.scalars().first()

        # Create a one-person team for this participant.
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()

        display_name = (
            user.full_name if user and user.full_name
            else user.email if user
            else "Participant"
        )

        team = Team(
            name=f"{display_name[:80]}'s Solo Team",
            description="Individual hackathon participation",
            max_members=1,
            owner_id=user_id,
            hackathon_id=hackathon_id,
        )

        db.add(team)
        await db.flush()

        # Add the participant as a team member.
        db.add(
            TeamMember(
                team_id=team.id,
                user_id=user_id,
                role="owner",
            )
        )

        # Register the team for this hackathon.
        db.add(
            TeamHackathon(
                team_id=team.id,
                hackathon_id=hackathon_id,
                status="registered",
            )
        )

        # Connect the participant to the team.
        participant.team_id = team.id

        # Preserve the existing project.
        if solo_project is not None:
            solo_project.team_id = team.id

        await db.commit()
        await db.refresh(team)

    else:
        # Ensure existing team registration is connected.
        participant.team_id = team.id

        membership_result = await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team.id,
                TeamMember.user_id == user_id,
            )
        )

        if membership_result.scalar_one_or_none() is None:
            db.add(
                TeamMember(
                    team_id=team.id,
                    user_id=user_id,
                    role="owner" if team.owner_id == user_id else "member",
                )
            )

        registration_result = await db.execute(
            select(TeamHackathon).where(
                TeamHackathon.team_id == team.id,
                TeamHackathon.hackathon_id == hackathon_id,
            )
        )

        if registration_result.scalar_one_or_none() is None:
            db.add(
                TeamHackathon(
                    team_id=team.id,
                    hackathon_id=hackathon_id,
                    status="registered",
                )
            )

        await db.commit()

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
    # TEAM MEMBERS
    # --------------------------------------------------------

    team_members = []

    if team is not None:
        members_result = await db.execute(
            select(TeamMember, User, Participant)
            .join(
                User,
                TeamMember.user_id == User.id,
            )
            .join(
                Participant,
                (
                    (Participant.user_id == User.id)
                    & (
                        Participant.hackathon_id
                        == hackathon_id
                    )
                ),
            )
            .where(
                TeamMember.team_id == team.id,
            )
            .order_by(
                User.full_name.asc(),
                User.email.asc(),
            )
        )

        for member, user, member_participant in members_result.all():
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
