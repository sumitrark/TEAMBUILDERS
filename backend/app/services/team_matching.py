from uuid import UUID
from app.models.user import User
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.team_hackathon import TeamHackathon
from app.models.participant import Participant
from app.models.hackathon import Hackathon


ACTIVE_PARTICIPANT_STATUSES = (
    "joined",
    "registered",
    "confirmed",
)


async def check_member_schedule_conflict(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
    team_id: UUID | None = None,
):
    """
    Check whether a user is already participating in:
    - Another team in the requested hackathon.
    - An individual registration in the requested hackathon.
    - Another hackathon with overlapping dates.

    team_id identifies the team the user is attempting to join.
    It is optional to preserve compatibility with existing callers.

    Returns None when no conflict exists.
    Otherwise returns a conflict dictionary.
    """

    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id
        )
    )

    requested = result.scalar_one_or_none()

    if requested is None:
        return {
            "conflict": True,
            "reason": "Hackathon not found",
        }

    # Find every team where the user is either:
    # - The owner
    # - An accepted member

    result = await db.execute(
        select(Team.id)
        .outerjoin(
            TeamMember,
            TeamMember.team_id == Team.id,
        )
        .where(
            or_(
                Team.owner_id == user_id,
                TeamMember.user_id == user_id,
            )
        )
        .distinct()
    )

    user_team_ids = set(result.scalars().all())

    conflicts = {}

    # --------------------------------------------------
    # Check Participant registrations
    # --------------------------------------------------

    result = await db.execute(
        select(Participant, Hackathon)
        .join(
            Hackathon,
            Hackathon.id == Participant.hackathon_id,
        )
        .where(
            Participant.user_id == user_id,
            func.lower(Participant.status).in_(
                ACTIVE_PARTICIPANT_STATUSES
            ),
        )
    )

    participant_rows = result.all()

    for participant, existing in participant_rows:

        # Same hackathon: only the intended team is allowed.
        if existing.id == hackathon_id:

            if (
                team_id is not None
                and participant.team_id == team_id
            ):
                continue

            conflicts[existing.id] = {
                "existing_hackathon_id": str(existing.id),
                "existing_hackathon_title": existing.title,
                "existing_start_date": existing.start_date,
                "existing_end_date": existing.end_date,
                "participation_type": (
                    "individual"
                    if participant.team_id is None
                    else "team"
                ),
                "existing_team_id": (
                    str(participant.team_id)
                    if participant.team_id
                    else None
                ),
            }

            continue

        if (
            requested.start_date is None
            or requested.end_date is None
            or existing.start_date is None
            or existing.end_date is None
        ):
            continue

        overlaps = (
            requested.start_date <= existing.end_date
            and requested.end_date >= existing.start_date
        )

        if overlaps:
            conflicts[existing.id] = {
                "existing_hackathon_id": str(existing.id),
                "existing_hackathon_title": existing.title,
                "existing_start_date": existing.start_date,
                "existing_end_date": existing.end_date,
                "participation_type": (
                    "individual"
                    if participant.team_id is None
                    else "team"
                ),
                "existing_team_id": (
                    str(participant.team_id)
                    if participant.team_id
                    else None
                ),
            }

    # --------------------------------------------------
    # Check TeamHackathon registrations
    # --------------------------------------------------

    if user_team_ids:

        result = await db.execute(
            select(
                TeamHackathon,
                Hackathon,
                Team,
            )
            .join(
                Hackathon,
                Hackathon.id == TeamHackathon.hackathon_id,
            )
            .join(
                Team,
                Team.id == TeamHackathon.team_id,
            )
            .where(
                TeamHackathon.team_id.in_(user_team_ids)
            )
        )

        registration_rows = result.all()

        for registration, existing, existing_team in registration_rows:

            # Same target team and hackathon is not a conflict.
            if (
                existing.id == hackathon_id
                and team_id is not None
                and registration.team_id == team_id
            ):
                continue

            if existing.id == hackathon_id:
                conflicts[existing.id] = {
                    "existing_hackathon_id": str(existing.id),
                    "existing_hackathon_title": existing.title,
                    "existing_start_date": existing.start_date,
                    "existing_end_date": existing.end_date,
                    "participation_type": "team",
                    "existing_team_id": str(existing_team.id),
                    "existing_team_name": existing_team.name,
                }
                continue

            if (
                requested.start_date is None
                or requested.end_date is None
                or existing.start_date is None
                or existing.end_date is None
            ):
                continue

            overlaps = (
                requested.start_date <= existing.end_date
                and requested.end_date >= existing.start_date
            )

            if overlaps:
                conflicts[existing.id] = {
                    "existing_hackathon_id": str(existing.id),
                    "existing_hackathon_title": existing.title,
                    "existing_start_date": existing.start_date,
                    "existing_end_date": existing.end_date,
                    "participation_type": "team",
                    "existing_team_id": str(existing_team.id),
                    "existing_team_name": existing_team.name,
                }

    # --------------------------------------------------
    # Return conflict information
    # --------------------------------------------------

    if conflicts:

        first_conflict = next(iter(conflicts.values()))

        return {
            "conflict": True,
            "reason": "Schedule conflict",
            **first_conflict,
            "requested_hackathon_id": str(requested.id),
            "requested_hackathon_title": requested.title,
            "requested_start_date": requested.start_date,
            "requested_end_date": requested.end_date,
            "all_conflicts": list(conflicts.values()),
        }

    return None


async def can_user_join_hackathon(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
    team_id: UUID | None = None,
) -> bool:

    conflict = await check_member_schedule_conflict(
        db=db,
        user_id=user_id,
        hackathon_id=hackathon_id,
        team_id=team_id,
    )

    return conflict is None



async def check_team_schedule_conflicts(
    db: AsyncSession,
    team_id: UUID,
    hackathon_id: UUID,
):
    """
    Check the owner and all accepted team members against
    the requested hackathon schedule.
    """

    result = await db.execute(
        select(Team).where(Team.id == team_id)
    )
    team = result.scalar_one_or_none()

    if team is None:
        return {"error": "TEAM_NOT_FOUND"}

    result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id
        )
    )
    requested = result.scalar_one_or_none()

    if requested is None:
        return {"error": "HACKATHON_NOT_FOUND"}

    # Collect owner and accepted members.
    result = await db.execute(
        select(TeamMember.user_id).where(
            TeamMember.team_id == team_id
        )
    )

    member_ids = set(result.scalars().all())
    member_ids.add(team.owner_id)

    # Load member details in one query.
    result = await db.execute(
        select(User).where(User.id.in_(member_ids))
    )

    users = {
        user.id: user
        for user in result.scalars().all()
    }

    conflicts = []
    available_members = []

    for member_id in member_ids:
        user = users.get(member_id)

        if user is None:
            continue

        conflict = await check_member_schedule_conflict(
            db=db,
            user_id=member_id,
            hackathon_id=hackathon_id,
            team_id=team_id,
        )

        member_info = {
            "user_id": str(member_id),
            "full_name": user.full_name,
            "username": user.username,
            "role": (
                "owner"
                if member_id == team.owner_id
                else "member"
            ),
        }

        if conflict is not None:
            conflicts.append({
                **member_info,
                "conflict": conflict,
            })
        else:
            available_members.append(member_info)

    return {
        "team_id": str(team.id),
        "team_name": team.name,
        "hackathon_id": str(requested.id),
        "hackathon_title": requested.title,
        "start_date": requested.start_date,
        "end_date": requested.end_date,
        "can_participate": len(conflicts) == 0,
        "total_members": len(member_ids),
        "available_count": len(available_members),
        "conflict_count": len(conflicts),
        "available_members": available_members,
        "conflicts": conflicts,
    }
