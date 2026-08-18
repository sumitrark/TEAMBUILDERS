from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team_member import TeamMember
from app.models.team import Team


async def get_team_members(
    db: AsyncSession,
    team_id: UUID,
):
    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.team_id == team_id)
        .order_by(TeamMember.joined_at)
    )

    return result.scalars().all()


async def get_team_member(
    db: AsyncSession,
    team_id: UUID,
    user_id: UUID,
):
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
        )
    )

    return result.scalar_one_or_none()


async def add_team_member(
    db: AsyncSession,
    team_id: UUID,
    user_id: UUID,
    role: str = "member",
):
    # Check whether already a member
    existing = await get_team_member(
        db,
        team_id,
        user_id,
    )

    if existing:
        return "ALREADY_MEMBER"

    # Get team
    result = await db.execute(
        select(Team).where(
            Team.id == team_id
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        return "TEAM_NOT_FOUND"

    # Count current members
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id
        )
    )

    members = result.scalars().all()

    if len(members) >= team.max_members:
        return "TEAM_FULL"

    member = TeamMember(
        team_id=team_id,
        user_id=user_id,
        role=role,
    )

    db.add(member)

    await db.commit()
    await db.refresh(member)

    return member


async def remove_team_member(
    db: AsyncSession,
    team_id: UUID,
    user_id: UUID,
):
    member = await get_team_member(
        db,
        team_id,
        user_id,
    )

    if member is None:
        return False

    await db.delete(member)
    await db.commit()

    return True