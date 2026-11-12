
from uuid import UUID

from sqlalchemy import select, or_,delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team_member import TeamMember
from app.models.team_invitation import TeamInvitation
from app.models.participant import Participant
from app.models.team_hackathon import TeamHackathon
from app.models.hackathon import Hackathon
from app.models.team import Team
from app.schemas.team import TeamCreate
from app.services.achievement_service import award_achievement
from app.services.team_matching import check_team_schedule_conflicts

# =========================================================
# CREATE TEAM
# =========================================================

async def create_team(
    db: AsyncSession,
    owner_id: UUID,
    data: TeamCreate,
):
    team = Team(
        name=data.name,
        description=data.description,
        max_members=data.max_members,
        owner_id=owner_id,
        hackathon_id=data.hackathon_id,
        required_skills=data.required_skills,
    )

    db.add(team)

    await db.commit()
    await db.refresh(team)

    await award_achievement(
        db=db,
        user_id=owner_id,
        code="TEAM_BUILDER",
    )

    return team


# =========================================================
# GET MY TEAMS
# =========================================================


async def get_my_teams(
    db: AsyncSession,
    user_id: UUID,
):
    member_team_ids = select(TeamMember.team_id).where(
        TeamMember.user_id == user_id
    )

    result = await db.execute(
        select(Team)
        .where(
            or_(
                Team.owner_id == user_id,
                Team.id.in_(member_team_ids),
            )
        )
        .order_by(Team.created_at.desc())
    )

    return result.scalars().all()


async def get_team(
    db: AsyncSession,
    team_id: UUID,
    user_id: UUID,
):
    member_team_ids = select(TeamMember.team_id).where(
        TeamMember.user_id == user_id
    )

    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            or_(
                Team.owner_id == user_id,
                Team.id.in_(member_team_ids),
            ),
        )
    )

    return result.scalar_one_or_none()

# =========================================================
# UPDATE TEAM
# =========================================================

async def update_team(
    db: AsyncSession,
    team_id: UUID,
    owner_id: UUID,
    data: TeamCreate,
):
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.owner_id == owner_id,
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        return None

    team.name = data.name
    team.description = data.description
    team.max_members = data.max_members
    team.hackathon_id = data.hackathon_id
    team.required_skills = data.required_skills

    await db.commit()
    await db.refresh(team)

    return team


# =========================================================
# DELETE TEAM
# =========================================================

async def delete_team(
    db: AsyncSession,
    team_id: UUID,
    owner_id: UUID,
):
    try:
        # First check whether the team exists.
        result = await db.execute(
            select(Team).where(Team.id == team_id)
        )

        team = result.scalar_one_or_none()

        if team is None:
            return "TEAM_NOT_FOUND"

        # Only the actual owner can delete the team.
        if team.owner_id != owner_id:
            return "NOT_TEAM_OWNER"

        # A team assigned to a hackathon cannot be deleted.
        if team.hackathon_id is not None:
            return "TEAM_REGISTERED"

        # Check the explicit team registration table.
        result = await db.execute(
            select(TeamHackathon.id).where(
                TeamHackathon.team_id == team_id
            ).limit(1)
        )

        if result.scalar_one_or_none() is not None:
            return "TEAM_REGISTERED"

        # Never delete a team while participant records reference it.
        result = await db.execute(
            select(Participant.user_id).where(
                Participant.team_id == team_id
            ).limit(1)
        )

        if result.scalar_one_or_none() is not None:
            return "TEAM_REGISTERED"

        # The team is unregistered. Remove its pending invitations.
        await db.execute(
            delete(TeamInvitation).where(
                TeamInvitation.team_id == team_id
            )
        )

        # Remove accepted memberships.
        await db.execute(
            delete(TeamMember).where(
                TeamMember.team_id == team_id
            )
        )

        # Finally delete the team itself.
        await db.delete(team)
        await db.commit()

        return "SUCCESS"

    except Exception:
        await db.rollback()
        raise


# =========================================================
# REGISTER TEAM FOR HACKATHON
# =========================================================

async def register_team_for_hackathon(
    db: AsyncSession,
    team_id: UUID,
    owner_id: UUID,
    hackathon_id: UUID,
):
    from app.services.hackathon_lifecycle import get_hackathon_status

    # 1. Find team and verify ownership.
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.owner_id == owner_id,
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        return "TEAM_NOT_FOUND"

    # 2. Find hackathon.
    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    # 3. Check whether team participation is allowed.
    participation_mode = (
        getattr(hackathon, "participation_mode", None) or "both"
    ).lower()

    if participation_mode not in ("team", "both"):
        return "TEAM_PARTICIPATION_NOT_ALLOWED"

    # 4. Verify registration window.
    if not hackathon.is_active:
        return "HACKATHON_INACTIVE"

    lifecycle_status = get_hackathon_status(hackathon)

    if lifecycle_status != "REGISTRATION_OPEN":
        if lifecycle_status in ("DRAFT", "UPCOMING"):
            return "REGISTRATION_NOT_OPEN"

        if lifecycle_status == "LIVE":
            return "HACKATHON_ALREADY_STARTED"

        return "REGISTRATION_CLOSED"

    # 5. Prevent moving a team already assigned elsewhere.
    if (
        team.hackathon_id is not None
        and team.hackathon_id != hackathon_id
    ):
        return "TEAM_ALREADY_ASSIGNED_TO_ANOTHER_HACKATHON"

    # 6. Check duplicate team registration.
    result = await db.execute(
        select(TeamHackathon).where(
            TeamHackathon.team_id == team_id,
            TeamHackathon.hackathon_id == hackathon_id,
        )
    )

    if result.scalar_one_or_none() is not None:
        return "ALREADY_REGISTERED"

    # 7. Get accepted team members and include owner.
    result = await db.execute(
        select(TeamMember.user_id).where(
            TeamMember.team_id == team_id
        )
    )

    member_ids = set(result.scalars().all())
    member_ids.add(owner_id)

    # 8. Enforce team capacity.
    if (
        team.max_members is not None
        and len(member_ids) > team.max_members
    ):
        return "TEAM_SIZE_EXCEEDED"

    if (
        hackathon.team_size is not None
        and len(member_ids) > hackathon.team_size
    ):
        return "TEAM_SIZE_EXCEEDED"

    # 9. Check existing registrations for all members.
    result = await db.execute(
        select(Participant).where(
            Participant.user_id.in_(member_ids),
            Participant.hackathon_id == hackathon_id,
        )
    )

    existing_participants = {
        participant.user_id: participant
        for participant in result.scalars().all()
    }

    for participant in existing_participants.values():
        if participant.team_id is None:
            return "MEMBER_ALREADY_REGISTERED_INDIVIDUALLY"

        if participant.team_id != team_id:
            return "MEMBER_ALREADY_REGISTERED_WITH_ANOTHER_TEAM"

    # 10. Check schedule conflicts for every member, including owner.
    result = await db.execute(
        select(Participant, Hackathon)
        .join(
            Hackathon,
            Participant.hackathon_id == Hackathon.id,
        )
        .where(
            Participant.user_id.in_(member_ids),
            Participant.hackathon_id != hackathon_id,
            Participant.status.in_(
                ["Joined", "joined", "registered", "Registered"]
            ),
        )
    )

    existing_participations = result.all()

    for _, existing_hackathon in existing_participations:
        if (
            existing_hackathon.start_date is None
            or existing_hackathon.end_date is None
            or hackathon.start_date is None
            or hackathon.end_date is None
        ):
            continue

        overlaps = (
            existing_hackathon.start_date <= hackathon.end_date
            and existing_hackathon.end_date >= hackathon.start_date
        )

        if overlaps:
            return "MEMBER_SCHEDULE_CONFLICT"

    # 11. Create team registration.
    registration = TeamHackathon(
        team_id=team_id,
        hackathon_id=hackathon_id,
        status="registered",
    )

    db.add(registration)

    # 12. Synchronize owner and accepted members as participants.
    for member_id in member_ids:
        participant = existing_participants.get(member_id)

        if participant is None:
            db.add(
                Participant(
                    user_id=member_id,
                    hackathon_id=hackathon_id,
                    team_id=team_id,
                    status="Joined",
                )
            )
        else:
            participant.status = "Joined"

    team.hackathon_id = hackathon_id

    try:
        await db.commit()
        await db.refresh(registration)
    except Exception:
        await db.rollback()
        raise

    return registration
