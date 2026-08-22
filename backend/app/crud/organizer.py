from uuid import UUID
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hackathon import Hackathon
from app.models.participant import Participant
from app.models.team import Team
from app.models.project import Project
from app.models.judge import Judge
from app.models.user import User
from app.schemas.organizer import OrganizerHackathonUpdate


# ============================================================
# ORGANIZER HACKATHONS
# ============================================================

async def get_organizer_hackathons(
    db: AsyncSession,
    organizer_id: UUID,
):
    result = await db.execute(
        select(Hackathon)
        .where(
            Hackathon.organizer_id == organizer_id
        )
        .order_by(
            Hackathon.created_at.desc()
        )
    )

    return result.scalars().all()


# ============================================================
# ORGANIZER STATS
# ============================================================

async def get_organizer_stats(
    db: AsyncSession,
    organizer_id: UUID,
):
    result = await db.execute(
        select(Hackathon.id)
        .where(
            Hackathon.organizer_id == organizer_id
        )
    )

    hackathon_ids = result.scalars().all()

    if not hackathon_ids:
        return {
            "hackathons": 0,
            "participants": 0,
            "teams": 0,
            "projects": 0,
        }

    result = await db.execute(
        select(Participant.id)
        .where(
            Participant.hackathon_id.in_(hackathon_ids)
        )
    )

    participant_ids = result.scalars().all()

    result = await db.execute(
        select(Team.id)
        .where(
            Team.hackathon_id.in_(hackathon_ids)
        )
    )

    team_ids = result.scalars().all()

    project_count = 0

    if team_ids:
        result = await db.execute(
            select(Project.id)
            .where(
                Project.team_id.in_(team_ids)
            )
        )

        project_count = len(
            result.scalars().all()
        )

    return {
        "hackathons": len(hackathon_ids),
        "participants": len(participant_ids),
        "teams": len(team_ids),
        "projects": project_count,
    }


# ============================================================
# UPDATE HACKATHON
# ============================================================

async def update_organizer_hackathon(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    data: OrganizerHackathonUpdate,
):
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return None

    updates = data.model_dump(
        exclude_unset=True
    )

    for field, value in updates.items():
        setattr(
            hackathon,
            field,
            value,
        )

    await db.commit()
    await db.refresh(hackathon)

    return hackathon


# ============================================================
# DELETE HACKATHON
# ============================================================

async def delete_organizer_hackathon(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return False

    await db.delete(hackathon)
    await db.commit()

    return True


# ============================================================
# OPEN / CLOSE HACKATHON
# ============================================================

async def toggle_hackathon_status(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return None

    if hackathon.status.lower() == "open":
        hackathon.status = "Closed"
        hackathon.is_active = False
    else:
        hackathon.status = "Open"
        hackathon.is_active = True

    await db.commit()
    await db.refresh(hackathon)

    return hackathon


# ============================================================
# JUDGE INVITATION
# ============================================================

async def accept_judge_invitation(
    db: AsyncSession,
    user_id: UUID,
    invitation_code: str,
):
    # Find hackathon using secure invitation code
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.judge_invitation_code
            == invitation_code
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "INVALID_CODE"

    # Hackathon must be active
    if not hackathon.is_active:
        return "HACKATHON_CLOSED"

    # Organizer cannot become their own judge
    if hackathon.organizer_id == user_id:
        return "ORGANIZER_CANNOT_BE_JUDGE"

    # Check whether already a judge
    result = await db.execute(
        select(Judge).where(
            Judge.hackathon_id == hackathon.id,
            Judge.user_id == user_id,
        )
    )

    existing_judge = result.scalar_one_or_none()

    if existing_judge:
        return existing_judge

    # Create judge
    judge = Judge(
        hackathon_id=hackathon.id,
        user_id=user_id,
        status="accepted",
    )

    db.add(judge)

    await db.commit()
    await db.refresh(judge)

    return judge


# ============================================================
# GET JUDGES FOR ORGANIZER
# ============================================================

async def get_hackathon_judges(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    # First verify ownership
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return None

    result = await db.execute(
        select(Judge).where(
            Judge.hackathon_id == hackathon_id
        )
    )

    return result.scalars().all()


# ============================================================
# REMOVE JUDGE
# ============================================================

async def remove_judge(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    judge_id: UUID,
):
    # Verify organizer owns hackathon
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return None

    result = await db.execute(
        select(Judge).where(
            Judge.id == judge_id,
            Judge.hackathon_id == hackathon_id,
        )
    )

    judge = result.scalar_one_or_none()

    if judge is None:
        return False

    await db.delete(judge)
    await db.commit()

    return True

async def get_organizer_judges(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    # Verify ownership
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return None

    result = await db.execute(
        select(Judge, User)
        .join(
            User,
            Judge.user_id == User.id,
        )
        .where(
            Judge.hackathon_id == hackathon_id
        )
        .order_by(
            Judge.created_at.desc()
        )
    )

    rows = result.all()

    return [
        {
            "id": judge.id,
            "hackathon_id": judge.hackathon_id,
            "user_id": judge.user_id,
            "name": user.full_name,
            "username": user.username,
            "email": user.email,
            "status": judge.status,
            "created_at": judge.created_at,
        }
        for judge, user in rows
    ]


async def invite_judge(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    email: str,
):
    from app.models.judge import Judge

    # --------------------------------------------------------
    # 1. Verify organizer owns hackathon
    # --------------------------------------------------------

    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    # --------------------------------------------------------
    # 2. Find user by email
    # --------------------------------------------------------

    result = await db.execute(
        select(User).where(
            User.email == email
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        return "USER_NOT_FOUND"

    # --------------------------------------------------------
    # 3. Check whether user is already a participant
    # --------------------------------------------------------

    result = await db.execute(
        select(Participant).where(
            Participant.hackathon_id == hackathon_id,
            Participant.user_id == user.id,
        )
    )

    participant = result.scalar_one_or_none()

    if participant is not None:
        return "PARTICIPANT_CONFLICT"

    # --------------------------------------------------------
    # 4. Check existing judge
    # --------------------------------------------------------

    result = await db.execute(
        select(Judge).where(
            Judge.hackathon_id == hackathon_id,
            Judge.user_id == user.id,
        )
    )

    existing_judge = result.scalar_one_or_none()

    if existing_judge is not None:
        return "ALREADY_JUDGE"

    # --------------------------------------------------------
    # 5. Create judge invitation
    # --------------------------------------------------------

    judge = Judge(
        hackathon_id=hackathon_id,
        user_id=user.id,
        status="invited",
    )

    db.add(judge)

    await db.commit()
    await db.refresh(judge)

    return judge

async def get_organizer_participants(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return None

    result = await db.execute(
        select(Participant, User)
        .join(
            User,
            Participant.user_id == User.id,
        )
        .where(
            Participant.hackathon_id == hackathon_id
        )
        .order_by(User.full_name)
    )

    rows = result.all()

    return [
        {
            "id": participant.id,
            "user_id": participant.user_id,
            "name": user.full_name,
            "username": user.username,
            "email": user.email,
            "college": user.college,
            "course": user.course,
            "year": user.year,
            "status": participant.status,
            "team_id": participant.team_id,
        }
        for participant, user in rows
    ]


async def get_organizer_teams(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return None

    result = await db.execute(
        select(Team)
        .where(
            Team.hackathon_id == hackathon_id
        )
        .order_by(Team.created_at.desc())
    )

    teams = result.scalars().all()

    response = []

    for team in teams:
        member_result = await db.execute(
            select(
                User.id,
                User.full_name,
                User.username,
                User.email,
            )
            .join(
                Participant,
                Participant.user_id == User.id,
            )
            .where(
                Participant.team_id == team.id
            )
        )

        members = member_result.all()

        response.append(
            {
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "max_members": team.max_members,
                "owner_id": team.owner_id,
                "hackathon_id": team.hackathon_id,
                "members": [
                    {
                        "id": member.id,
                        "name": member.full_name,
                        "username": member.username,
                        "email": member.email,
                    }
                    for member in members
                ],
            }
        )

    return response

async def get_organizer_analytics(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    # Verify organizer owns this hackathon
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return None

    # Participants
    participant_result = await db.execute(
        select(Participant.id).where(
            Participant.hackathon_id == hackathon_id
        )
    )

    participants = participant_result.scalars().all()

    # Teams
    team_result = await db.execute(
        select(Team.id).where(
            Team.hackathon_id == hackathon_id
        )
    )

    team_ids = team_result.scalars().all()

    # Projects
    projects = []

    if team_ids:
        project_result = await db.execute(
            select(Project.id).where(
                Project.team_id.in_(team_ids)
            )
        )

        projects = project_result.scalars().all()

    # Judges
    from app.models.judge import Judge

    judge_result = await db.execute(
        select(Judge.id).where(
            Judge.hackathon_id == hackathon_id
        )
    )

    judges = judge_result.scalars().all()

    return {
        "participants": len(participants),
        "teams": len(team_ids),
        "projects": len(projects),
        "judges": len(judges),
    }


# ============================================================
# TEAM MANAGEMENT
# ============================================================

async def remove_team_member(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    team_id: UUID,
    user_id: UUID,
):
    # --------------------------------------------------------
    # 1. Verify organizer owns the hackathon
    # --------------------------------------------------------

    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    # --------------------------------------------------------
    # 2. Verify team belongs to hackathon
    # --------------------------------------------------------

    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.hackathon_id == hackathon_id,
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        return "TEAM_NOT_FOUND"

    # --------------------------------------------------------
    # 3. Do not allow removing the team owner
    # --------------------------------------------------------

    if team.owner_id == user_id:
        return "OWNER_CANNOT_BE_REMOVED"

    # --------------------------------------------------------
    # 4. Find team member
    # --------------------------------------------------------

    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
        )
    )

    member = result.scalar_one_or_none()

    if member is None:
        return "MEMBER_NOT_FOUND"

    # --------------------------------------------------------
    # 5. Remove member
    # --------------------------------------------------------

    await db.delete(member)

    # Keep participant record synchronized
    participant_result = await db.execute(
        select(Participant).where(
            Participant.hackathon_id == hackathon_id,
            Participant.user_id == user_id,
        )
    )

    participant = participant_result.scalar_one_or_none()

    if participant is not None:
        participant.team_id = None

    await db.commit()

    return True


async def delete_organizer_team(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    team_id: UUID,
):
    # --------------------------------------------------------
    # 1. Verify organizer owns hackathon
    # --------------------------------------------------------

    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    # --------------------------------------------------------
    # 2. Find team
    # --------------------------------------------------------

    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.hackathon_id == hackathon_id,
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        return "TEAM_NOT_FOUND"

    # --------------------------------------------------------
    # 3. Remove team members from participant records
    # --------------------------------------------------------

    member_result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id
        )
    )

    members = member_result.scalars().all()

    for member in members:
        participant_result = await db.execute(
            select(Participant).where(
                Participant.hackathon_id == hackathon_id,
                Participant.user_id == member.user_id,
            )
        )

        participant = (
            participant_result.scalar_one_or_none()
        )

        if participant is not None:
            participant.team_id = None

    # --------------------------------------------------------
    # 4. Delete team
    # TeamMember rows cascade because of FK
    # --------------------------------------------------------

    await db.delete(team)

    await db.commit()

    return True

# ============================================================
# ORGANIZER PROJECTS
# ============================================================

async def get_organizer_projects(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    # Verify organizer owns the hackathon
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return None

    # Get teams belonging to this hackathon
    team_result = await db.execute(
        select(Team.id).where(
            Team.hackathon_id == hackathon_id
        )
    )

    team_ids = team_result.scalars().all()

    if not team_ids:
        return []

    # Get projects belonging to those teams
    project_result = await db.execute(
        select(Project)
        .where(
            Project.team_id.in_(team_ids)
        )
        .order_by(
            Project.created_at.desc()
        )
    )

    return project_result.scalars().all()


async def get_organizer_project(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    project_id: UUID,
):
    # Verify organizer owns the hackathon
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return None

    # Get teams belonging to this hackathon
    team_result = await db.execute(
        select(Team.id).where(
            Team.hackathon_id == hackathon_id
        )
    )

    team_ids = team_result.scalars().all()

    if not team_ids:
        return None

    # Get requested project
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.team_id.in_(team_ids),
        )
    )

    return project_result.scalar_one_or_none()

