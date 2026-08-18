from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team_member import TeamMember
from app.models.team_hackathon import TeamHackathon
from app.models.hackathon import Hackathon


async def check_member_schedule_conflict(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
):
    """
    Check whether a user is already participating in another
    hackathon whose dates overlap with the requested hackathon.

    Returns:
        None if there is no conflict.
        dict containing conflict information if a conflict exists.
    """

    # ---------------------------------------------------------
    # Get the hackathon the user wants to join
    # ---------------------------------------------------------

    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id
        )
    )

    requested_hackathon = result.scalar_one_or_none()

    if requested_hackathon is None:
        return {
            "conflict": True,
            "reason": "Hackathon not found",
        }

    # ---------------------------------------------------------
    # Find all teams where this user is a member
    # ---------------------------------------------------------

    result = await db.execute(
        select(TeamMember.team_id).where(
            TeamMember.user_id == user_id
        )
    )

    team_ids = result.scalars().all()

    if not team_ids:
        return None

    # ---------------------------------------------------------
    # Find hackathons registered by those teams
    # ---------------------------------------------------------

    result = await db.execute(
        select(Hackathon)
        .join(
            TeamHackathon,
            TeamHackathon.hackathon_id == Hackathon.id,
        )
        .where(
            TeamHackathon.team_id.in_(team_ids)
        )
    )

    existing_hackathons = result.scalars().all()

    # ---------------------------------------------------------
    # Check date overlap
    #
    # Two events overlap when:
    #
    # new_start < existing_end
    # AND
    # new_end > existing_start
    # ---------------------------------------------------------

    for existing in existing_hackathons:

        if (
            requested_hackathon.start_date < existing.end_date
            and
            requested_hackathon.end_date > existing.start_date
        ):
            return {
                "conflict": True,
                "reason": "Schedule conflict",
                "existing_hackathon_id": str(existing.id),
                "existing_hackathon_title": existing.title,
                "existing_start_date": existing.start_date,
                "existing_end_date": existing.end_date,
                "requested_hackathon_id": str(
                    requested_hackathon.id
                ),
                "requested_hackathon_title": (
                    requested_hackathon.title
                ),
                "requested_start_date": (
                    requested_hackathon.start_date
                ),
                "requested_end_date": (
                    requested_hackathon.end_date
                ),
            }

    return None


async def can_user_join_hackathon(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
) -> bool:
    """
    Simple helper that returns True when the user can
    participate in the requested hackathon.
    """

    conflict = await check_member_schedule_conflict(
        db=db,
        user_id=user_id,
        hackathon_id=hackathon_id,
    )

    return conflict is None