from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.team_invitation import TeamInvitation
from app.models.user import User

from app.services.team_matching import (
    check_member_schedule_conflict,
)

from app.crud.notification import create_notification

from app.services.achievement_service import (
    award_achievement,
)


# =========================================================
# CREATE INVITATION
# =========================================================

async def create_invitation(
    db: AsyncSession,
    team_id: UUID,
    inviter_id: UUID,
    invitee_id: UUID,
):
    # -----------------------------------------------------
    # Find team
    # -----------------------------------------------------

    result = await db.execute(
        select(Team).where(
            Team.id == team_id
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        return "TEAM_NOT_FOUND"

    # -----------------------------------------------------
    # Verify owner
    # -----------------------------------------------------

    if team.owner_id != inviter_id:
        return "NOT_TEAM_OWNER"

    # -----------------------------------------------------
    # Find invitee
    # -----------------------------------------------------

    result = await db.execute(
        select(User).where(
            User.id == invitee_id,
            User.is_active.is_(True),
        )
    )

    invitee = result.scalar_one_or_none()

    if invitee is None:
        return "USER_NOT_FOUND"

    # -----------------------------------------------------
    # Find inviter
    # -----------------------------------------------------

    result = await db.execute(
        select(User).where(
            User.id == inviter_id
        )
    )

    inviter = result.scalar_one_or_none()

    # -----------------------------------------------------
    # Prevent self invitation
    # -----------------------------------------------------

    if inviter_id == invitee_id:
        return "CANNOT_INVITE_SELF"

    # -----------------------------------------------------
    # Already member
    # -----------------------------------------------------

    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == invitee_id,
        )
    )

    if result.scalar_one_or_none():
        return "ALREADY_MEMBER"

    # -----------------------------------------------------
    # Team capacity
    # -----------------------------------------------------

    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id
        )
    )

    members = result.scalars().all()

    if len(members) >= team.max_members:
        return "TEAM_FULL"

    # -----------------------------------------------------
    # Existing invitation
    # -----------------------------------------------------

    result = await db.execute(
        select(TeamInvitation).where(
            TeamInvitation.team_id == team_id,
            TeamInvitation.invitee_id == invitee_id,
            TeamInvitation.status == "pending",
        )
    )

    if result.scalar_one_or_none():
        return "INVITATION_EXISTS"

    # -----------------------------------------------------
    # Create invitation
    # -----------------------------------------------------

    invitation = TeamInvitation(
        team_id=team_id,
        inviter_id=inviter_id,
        invitee_id=invitee_id,
        status="pending",
    )

    db.add(invitation)

    await db.flush()

    # -----------------------------------------------------
    # Notification
    # -----------------------------------------------------

    inviter_name = (
        inviter.full_name
        if inviter
        else "A teammate"
    )

    await create_notification(
        db=db,
        user_id=invitee_id,
        notification_type="team_invitation",
        title="New Team Invitation",
        message=(
            f"{inviter_name} invited you to join "
            f"the team '{team.name}'."
        ),
        action_url="/dashboard/invitations",
    )

    await db.commit()
    await db.refresh(invitation)

    return invitation


# =========================================================
# GET MY INVITATIONS
# =========================================================

async def get_my_invitations(
    db: AsyncSession,
    user_id: UUID,
):
    result = await db.execute(
        select(TeamInvitation)
        .where(
            TeamInvitation.invitee_id == user_id
        )
        .order_by(
            TeamInvitation.created_at.desc()
        )
    )

    return result.scalars().all()


# =========================================================
# RESPOND TO INVITATION
# =========================================================

async def respond_to_invitation(
    db: AsyncSession,
    invitation_id: UUID,
    user_id: UUID,
    accept: bool,
):
    # -----------------------------------------------------
    # Find invitation
    # -----------------------------------------------------

    result = await db.execute(
        select(TeamInvitation).where(
            TeamInvitation.id == invitation_id,
            TeamInvitation.invitee_id == user_id,
        )
    )

    invitation = result.scalar_one_or_none()

    if invitation is None:
        return "NOT_FOUND"

    if invitation.status != "pending":
        return "ALREADY_RESPONDED"

    # -----------------------------------------------------
    # Decline
    # -----------------------------------------------------

    if not accept:

        invitation.status = "declined"
        invitation.responded_at = datetime.now(timezone.utc)

        await db.flush()

        await create_notification(
            db=db,
            user_id=invitation.inviter_id,
            notification_type="team_invitation_declined",
            title="Invitation Declined",
            message=(
                "Your team invitation was declined."
            ),
            action_url=(
                f"/dashboard/teams/"
                f"{invitation.team_id}"
            ),
        )

        await db.commit()
        await db.refresh(invitation)

        return invitation

    # -----------------------------------------------------
    # Find team
    # -----------------------------------------------------

    result = await db.execute(
        select(Team).where(
            Team.id == invitation.team_id
        )
    )

    team = result.scalar_one_or_none()

    if team is None:
        return "TEAM_NOT_FOUND"

    # -----------------------------------------------------
    # Team capacity
    # -----------------------------------------------------

    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team.id
        )
    )

    members = result.scalars().all()

    if len(members) >= team.max_members:
        return "TEAM_FULL"

    # -----------------------------------------------------
    # Schedule conflict
    # -----------------------------------------------------

    if team.hackathon_id is not None:

        conflict = await check_member_schedule_conflict(
            db=db,
            user_id=user_id,
            hackathon_id=team.hackathon_id,
        )

        if conflict is not None:
            return {
                "CONFLICT": conflict
            }

    # -----------------------------------------------------
    # Duplicate membership
    # -----------------------------------------------------

    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team.id,
            TeamMember.user_id == user_id,
        )
    )

    if result.scalar_one_or_none():
        return "ALREADY_MEMBER"

    # -----------------------------------------------------
    # Accept invitation
    # -----------------------------------------------------

    invitation.status = "accepted"
    invitation.responded_at = datetime.now(timezone.utc)

    member = TeamMember(
        team_id=team.id,
        user_id=user_id,
        role="member",
    )

    db.add(member)

    await db.flush()

    # -----------------------------------------------------
    # Get accepted user
    # -----------------------------------------------------

    result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    accepted_user = result.scalar_one_or_none()

    accepted_user_name = (
        accepted_user.full_name
        if accepted_user
        else "A user"
    )

    # -----------------------------------------------------
    # Notify team owner
    # -----------------------------------------------------

    await create_notification(
        db=db,
        user_id=invitation.inviter_id,
        notification_type="team_invitation_accepted",
        title="Invitation Accepted",
        message=(
            f"{accepted_user_name} accepted your "
            f"invitation and joined '{team.name}'."
        ),
        action_url=(
            f"/dashboard/teams/{team.id}"
        ),
    )

    await db.commit()
    await db.refresh(invitation)

    # -----------------------------------------------------
    # Award COLLABORATOR
    # -----------------------------------------------------

    await award_achievement(
        db=db,
        user_id=user_id,
        code="COLLABORATOR",
    )

    return invitation