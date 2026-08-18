from uuid import UUID
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team_member import TeamMember
from app.models.team_hackathon import TeamHackathon
from app.models.hackathon import Hackathon
from app.models.team import Team
from app.schemas.team import TeamCreate
from app.services.achievement_service import award_achievement


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
    )

    db.add(team)

    await db.commit()
    await db.refresh(team)

    # Award achievement after successful team creation
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
    owner_id: UUID,
):
    result = await db.execute(
        select(Team)
        .where(
            Team.owner_id == owner_id
        )
        .order_by(
            Team.created_at.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# GET SINGLE TEAM
# =========================================================

async def get_team(
    db: AsyncSession,
    team_id: UUID,
    owner_id: UUID,
):
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.owner_id == owner_id,
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
    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.owner_id == owner_id,
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        return False

    await db.delete(team)

    await db.commit()

    return True


# =========================================================
# REGISTER TEAM FOR HACKATHON
# =========================================================

async def register_team_for_hackathon(
    db: AsyncSession,
    team_id: UUID,
    owner_id: UUID,
    hackathon_id: UUID,
):
    # -----------------------------------------------------
    # 1. Find team and verify ownership
    # -----------------------------------------------------

    result = await db.execute(
        select(Team).where(
            Team.id == team_id,
            Team.owner_id == owner_id,
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        return "TEAM_NOT_FOUND"

    # -----------------------------------------------------
    # 2. Find hackathon
    # -----------------------------------------------------

    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id
        )
    )

    hackathon = result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    # -----------------------------------------------------
    # 3. Check hackathon availability
    # -----------------------------------------------------

    if not hackathon.is_active:
        return "HACKATHON_INACTIVE"

    if hackathon.status.lower() not in [
        "open",
        "registration open",
    ]:
        return "REGISTRATION_CLOSED"

    # -----------------------------------------------------
    # 4. Check registration deadline
    # -----------------------------------------------------

    if (
        hackathon.registration_deadline
        and date.today() > hackathon.registration_deadline
    ):
        return "REGISTRATION_DEADLINE_PASSED"

    # -----------------------------------------------------
    # 5. Check duplicate registration
    # -----------------------------------------------------

    result = await db.execute(
        select(TeamHackathon).where(
            TeamHackathon.team_id == team_id,
            TeamHackathon.hackathon_id == hackathon_id,
        )
    )

    existing_registration = result.scalar_one_or_none()

    if existing_registration:
        return "ALREADY_REGISTERED"

    # -----------------------------------------------------
    # 6. Get team members
    # -----------------------------------------------------

    result = await db.execute(
        select(TeamMember.user_id).where(
            TeamMember.team_id == team_id
        )
    )

    member_ids = set(result.scalars().all())

    # Team owner is also a participant
    member_ids.add(owner_id)

    # -----------------------------------------------------
    # 7. Check maximum team size
    # -----------------------------------------------------

    if len(member_ids) > hackathon.team_size:
        return "TEAM_SIZE_EXCEEDED"

    # -----------------------------------------------------
    # 8. Check member schedule conflicts
    # -----------------------------------------------------

    if member_ids:

        result = await db.execute(
            select(
                TeamHackathon,
                Hackathon,
            )
            .join(
                Hackathon,
                TeamHackathon.hackathon_id
                == Hackathon.id,
            )
            .join(
                TeamMember,
                TeamHackathon.team_id
                == TeamMember.team_id,
            )
            .where(
                TeamMember.user_id.in_(member_ids),
                TeamHackathon.status == "registered",
            )
        )

        existing_participations = result.all()

        for (
            registration,
            existing_hackathon,
        ) in existing_participations:

            if existing_hackathon.id == hackathon_id:
                continue

            if (
                existing_hackathon.start_date
                <= hackathon.end_date
                and
                existing_hackathon.end_date
                >= hackathon.start_date
            ):
                return "MEMBER_SCHEDULE_CONFLICT"

    # -----------------------------------------------------
    # 9. Create registration
    # -----------------------------------------------------

    registration = TeamHackathon(
        team_id=team_id,
        hackathon_id=hackathon_id,
        status="registered",
    )

    db.add(registration)

    await db.commit()

    await db.refresh(registration)

    return registration