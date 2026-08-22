from uuid import UUID
import secrets
import string

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hackathon import Hackathon
from app.models.participant import Participant
from app.models.team import Team
from app.models.project import Project
from app.models.user import User
from app.models.judge import Judge


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

    participants_result = await db.execute(
        select(Participant.id)
        .where(
            Participant.hackathon_id.in_(hackathon_ids)
        )
    )

    team_result = await db.execute(
        select(Team.id)
        .where(
            Team.hackathon_id.in_(hackathon_ids)
        )
    )

    team_ids = team_result.scalars().all()

    project_count = 0

    if team_ids:
        project_result = await db.execute(
            select(Project.id)
            .where(
                Project.team_id.in_(team_ids)
            )
        )

        project_count = len(
            project_result.scalars().all()
        )

    return {
        "hackathons": len(hackathon_ids),
        "participants": len(
            participants_result.scalars().all()
        ),
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
    data,
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

    update_data = data.model_dump(
        exclude_unset=True
    )

    # Never allow frontend to change ownership
    update_data.pop("organizer_id", None)
    update_data.pop("organizer", None)

    for key, value in update_data.items():
        if hasattr(hackathon, key):
            setattr(hackathon, key, value)

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

    current_status = (
        hackathon.status or ""
    ).lower()

    if current_status in (
        "open",
        "registration open",
    ):
        hackathon.status = "Closed"
        hackathon.is_active = False
    else:
        hackathon.status = "Open"
        hackathon.is_active = True

    await db.commit()
    await db.refresh(hackathon)

    return hackathon


# ============================================================
# PARTICIPANTS
# ============================================================

async def get_organizer_participants(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    # Verify organizer ownership
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
        select(
            Participant,
            User,
        )
        .join(
            User,
            Participant.user_id == User.id,
        )
        .where(
            Participant.hackathon_id == hackathon_id
        )
        .order_by(
            User.full_name
        )
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


# Alias used by organizer route
get_hackathon_participants = get_organizer_participants


# ============================================================
# TEAMS
# ============================================================

async def get_organizer_teams(
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
        select(Team)
        .where(
            Team.hackathon_id == hackathon_id
        )
        .order_by(
            Team.created_at.desc()
        )
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


# Alias used by organizer route
get_hackathon_teams = get_organizer_teams


# ============================================================
# JUDGES
# ============================================================

async def get_hackathon_judges(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    # Verify organizer ownership
    ownership = await db.execute(
        select(Hackathon.id).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    if ownership.scalar_one_or_none() is None:
        return None

    result = await db.execute(
        select(
            Judge,
            User,
        )
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
            "user_id": judge.user_id,
            "name": user.full_name,
            "username": user.username,
            "email": user.email,
            "status": judge.status,
            "created_at": judge.created_at,
        }
        for judge, user in rows
    ]


# ============================================================
# GENERATE SECURE JUDGE CODE
# ============================================================

def generate_judge_code(length: int = 12) -> str:
    characters = (
        string.ascii_uppercase
        + string.digits
    )

    return "".join(
        secrets.choice(characters)
        for _ in range(length)
    )


# ============================================================
# INVITE JUDGE
# ============================================================

async def invite_judge(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    email: str,
):
    # --------------------------------------------------------
    # 1. Verify hackathon ownership
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
    # 2. Find user
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
    # 3. Do not allow organizer to judge own hackathon
    # --------------------------------------------------------

    if user.id == organizer_id:
        return "CONFLICT"

    # --------------------------------------------------------
    # 4. Check existing judge
    # --------------------------------------------------------

    result = await db.execute(
        select(Judge).where(
            Judge.hackathon_id == hackathon_id,
            Judge.user_id == user.id,
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        return "ALREADY_JUDGE"

    # --------------------------------------------------------
    # 5. Check whether user is a participant
    # --------------------------------------------------------

    participant_result = await db.execute(
        select(Participant).where(
            Participant.hackathon_id == hackathon_id,
            Participant.user_id == user.id,
        )
    )

    participant = (
        participant_result.scalar_one_or_none()
    )

    if participant:
        return "CONFLICT"

    # --------------------------------------------------------
    # 6. Create judge
    # --------------------------------------------------------

    judge = Judge(
        hackathon_id=hackathon_id,
        user_id=user.id,
        status="invited",
    )

    db.add(judge)

    # --------------------------------------------------------
    # 7. Generate invitation code if missing
    # --------------------------------------------------------

    if not hackathon.judge_invitation_code:
        hackathon.judge_invitation_code = (
            generate_judge_code()
        )

    await db.commit()
    await db.refresh(judge)

    return {
        "message": "Judge invitation created",
        "judge_id": str(judge.id),
        "email": user.email,
        "status": judge.status,
        "invitation_code": (
            hackathon.judge_invitation_code
        ),
    }


# ============================================================
# ACCEPT JUDGE INVITATION
# ============================================================

async def accept_judge_invitation(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
    invitation_code: str,
):
    # --------------------------------------------------------
    # 1. Find hackathon
    # --------------------------------------------------------

    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    # --------------------------------------------------------
    # 2. Find judge record
    # --------------------------------------------------------

    result = await db.execute(
        select(Judge).where(
            Judge.hackathon_id == hackathon_id,
            Judge.user_id == user_id,
        )
    )

    judge = result.scalar_one_or_none()

    if judge is None:
        return "INVITATION_NOT_FOUND"

    # --------------------------------------------------------
    # 3. Already processed
    # --------------------------------------------------------

    if judge.status in (
        "active",
        "accepted",
        "rejected",
    ):
        return "INVITATION_ALREADY_PROCESSED"

    # --------------------------------------------------------
    # 4. Validate secret code
    # --------------------------------------------------------

    if (
        not hackathon.judge_invitation_code
        or not secrets.compare_digest(
            hackathon.judge_invitation_code,
            invitation_code,
        )
    ):
        return "INVALID_INVITATION_CODE"

    # --------------------------------------------------------
    # 5. Check participant conflict
    # --------------------------------------------------------

    participant_result = await db.execute(
        select(Participant).where(
            Participant.hackathon_id == hackathon_id,
            Participant.user_id == user_id,
        )
    )

    participant = (
        participant_result.scalar_one_or_none()
    )

    if participant:
        return {
            "CONFLICT": {
                "message": (
                    "A hackathon participant "
                    "cannot become a judge."
                )
            }
        }

    # --------------------------------------------------------
    # 6. Accept
    # --------------------------------------------------------

    judge.status = "active"

    await db.commit()
    await db.refresh(judge)

    return judge

async def get_organizer_analytics(
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

    participant_result = await db.execute(
        select(Participant.id).where(
            Participant.hackathon_id == hackathon_id
        )
    )

    team_result = await db.execute(
        select(Team.id).where(
            Team.hackathon_id == hackathon_id
        )
    )

    team_ids = team_result.scalars().all()

    project_count = 0

    if team_ids:
        project_result = await db.execute(
            select(Project.id).where(
                Project.team_id.in_(team_ids)
            )
        )

        project_count = len(
            project_result.scalars().all()
        )

    from app.models.judge import Judge

    judge_result = await db.execute(
        select(Judge.id).where(
            Judge.hackathon_id == hackathon_id
        )
    )

    return {
        "participants": len(
            participant_result.scalars().all()
        ),
        "teams": len(team_ids),
        "projects": project_count,
        "judges": len(
            judge_result.scalars().all()
        ),
    }

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

    # Get projects submitted by those teams
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
    # Verify organizer owns hackathon
    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return None

    # Verify project belongs to a team in this hackathon
    team_result = await db.execute(
        select(Team.id).where(
            Team.hackathon_id == hackathon_id
        )
    )

    team_ids = team_result.scalars().all()

    if not team_ids:
        return None

    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.team_id.in_(team_ids),
        )
    )

    return project_result.scalar_one_or_none()