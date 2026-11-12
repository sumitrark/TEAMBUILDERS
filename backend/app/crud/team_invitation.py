
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.team_invitation import TeamInvitation
from app.models.user import User
from app.models.participant import Participant
from app.models.team_hackathon import TeamHackathon

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
    try:
        # Lock the team row to reduce concurrent capacity changes.
        result = await db.execute(
            select(Team)
            .where(Team.id == team_id)
            .with_for_update()
        )

        team = result.scalar_one_or_none()

        if team is None:
            return "TEAM_NOT_FOUND"

        # Only the team owner can invite.
        if team.owner_id != inviter_id:
            return "NOT_TEAM_OWNER"

        if inviter_id == invitee_id:
            return "CANNOT_INVITE_SELF"

        # Verify invitee eligibility.
        result = await db.execute(
            select(User).where(
                User.id == invitee_id,
                User.is_active.is_(True),
                User.is_deleted.is_(False),
                User.role == "student",
            )
        )

        invitee = result.scalar_one_or_none()

        if invitee is None:
            return "USER_NOT_FOUND"

        # Verify inviter exists and is active.
        result = await db.execute(
            select(User).where(
                User.id == inviter_id,
                User.is_active.is_(True),
                User.is_deleted.is_(False),
            )
        )

        inviter = result.scalar_one_or_none()

        if inviter is None:
            return "INVITER_NOT_FOUND"

        # Prevent inviting an existing member.
        result = await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team_id,
                TeamMember.user_id == invitee_id,
            )
        )

        if result.scalar_one_or_none() is not None:
            return "ALREADY_MEMBER"

        # Prevent duplicate pending invitations.
        result = await db.execute(
            select(TeamInvitation).where(
                TeamInvitation.team_id == team_id,
                TeamInvitation.invitee_id == invitee_id,
                TeamInvitation.status == "pending",
            )
        )

        if result.scalar_one_or_none() is not None:
            return "INVITATION_EXISTS"

        # Count accepted members.
        result = await db.execute(
            select(func.count(TeamMember.user_id)).where(
                TeamMember.team_id == team_id
            )
        )

        accepted_count = result.scalar_one() or 0

        # Count pending invitations.
        result = await db.execute(
            select(func.count(TeamInvitation.id)).where(
                TeamInvitation.team_id == team_id,
                TeamInvitation.status == "pending",
            )
        )

        pending_count = result.scalar_one() or 0

        # Capacity includes:
        # 1 owner + accepted members + pending invitations.
        reserved_slots = (
            1 + accepted_count + pending_count
        )

        if reserved_slots >= team.max_members:
            return "TEAM_FULL"

        invitation = TeamInvitation(
            team_id=team_id,
            inviter_id=inviter_id,
            invitee_id=invitee_id,
            status="pending",
        )

        db.add(invitation)
        await db.flush()

        await create_notification(
            db=db,
            user_id=invitee_id,
            notification_type="team_invitation",
            title="New Team Invitation",
            message=(
                f"{inviter.full_name} invited you to join "
                f"the team '{team.name}'."
            ),
            action_url="/dashboard/invitations",
        )

        await db.commit()
        await db.refresh(invitation)

        return invitation

    except Exception:
        await db.rollback()
        raise


# =========================================================
# GET MY INVITATIONS
# =========================================================

async def get_my_invitations(
    db: AsyncSession,
    user_id: UUID,
):
    result = await db.execute(
        select(
            TeamInvitation,
            User.full_name,
            Team.name,
            Team.description,
            Team.max_members,
        )
        .join(
            Team,
            Team.id == TeamInvitation.team_id,
        )
        .join(
            User,
            User.id == TeamInvitation.inviter_id,
        )
        .where(
            TeamInvitation.invitee_id == user_id,
        )
        .order_by(
            TeamInvitation.created_at.desc()
        )
    )

    rows = result.all()

    return [
        {
            "id": invitation.id,
            "team_id": invitation.team_id,
            "inviter_id": invitation.inviter_id,
            "invitee_id": invitation.invitee_id,
            "status": invitation.status,
            "created_at": invitation.created_at,
            "responded_at": invitation.responded_at,
            "inviter_name": inviter_name,
            "team_name": team_name,
            "team_description": team_description,
            "team_max_members": team_max_members,
        }
        for (
            invitation,
            inviter_name,
            team_name,
            team_description,
            team_max_members,
        ) in rows
    ]


# =========================================================
# RESPOND TO INVITATION
# =========================================================

async def respond_to_invitation(
    db: AsyncSession,
    invitation_id: UUID,
    user_id: UUID,
    accept: bool,
):
    try:
        # Lock the invitation to prevent duplicate responses.
        result = await db.execute(
            select(TeamInvitation)
            .where(
                TeamInvitation.id == invitation_id,
                TeamInvitation.invitee_id == user_id,
            )
            .with_for_update()
        )

        invitation = result.scalar_one_or_none()

        if invitation is None:
            return "NOT_FOUND"

        if invitation.status != "pending":
            return "ALREADY_RESPONDED"

        # -------------------------------------------------
        # DECLINE
        # -------------------------------------------------

        if not accept:

            invitation.status = "declined"
            invitation.responded_at = datetime.now(
                timezone.utc
            )

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
                    f"/dashboard/teams/{invitation.team_id}"
                ),
            )

            await db.commit()
            await db.refresh(invitation)

            return invitation

        # -------------------------------------------------
        # VERIFY INVITEE
        # -------------------------------------------------

        result = await db.execute(
            select(User).where(
                User.id == user_id,
                User.is_active.is_(True),
                User.is_deleted.is_(False),
                User.role == "student",
            )
        )

        accepted_user = result.scalar_one_or_none()

        if accepted_user is None:
            return "USER_NOT_FOUND"

        # -------------------------------------------------
        # FIND AND LOCK TEAM
        # -------------------------------------------------

        result = await db.execute(
            select(Team)
            .where(
                Team.id == invitation.team_id
            )
            .with_for_update()
        )

        team = result.scalar_one_or_none()

        if team is None:
            return "TEAM_NOT_FOUND"

        # -------------------------------------------------
        # DUPLICATE MEMBERSHIP
        # -------------------------------------------------

        result = await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team.id,
                TeamMember.user_id == user_id,
            )
        )

        if result.scalar_one_or_none() is not None:
            return "ALREADY_MEMBER"

        # -------------------------------------------------
        # CAPACITY CHECK
        # -------------------------------------------------

        result = await db.execute(
            select(func.count(TeamMember.user_id)).where(
                TeamMember.team_id == team.id
            )
        )

        accepted_count = result.scalar_one() or 0

        # Owner is included in total capacity.
        current_total = 1 + accepted_count

        if current_total >= team.max_members:
            return "TEAM_FULL"

        # -------------------------------------------------
        # FIND REGISTERED HACKATHONS
        # -------------------------------------------------

        registered_hackathon_ids = set()

        if team.hackathon_id is not None:
            registered_hackathon_ids.add(
                team.hackathon_id
            )

        result = await db.execute(
            select(TeamHackathon.hackathon_id).where(
                TeamHackathon.team_id == team.id
            )
        )

        registered_hackathon_ids.update(
            result.scalars().all()
        )

        # -------------------------------------------------
        # SCHEDULE VALIDATION
        # -------------------------------------------------

        for hackathon_id in registered_hackathon_ids:

            conflict = await check_member_schedule_conflict(
                db=db,
                user_id=user_id,
                hackathon_id=hackathon_id,
                team_id=team.id,
            )

            if conflict is not None:
                return {
                    "CONFLICT": conflict
                }

        # -------------------------------------------------
        # ADD ACCEPTED MEMBERSHIP
        # -------------------------------------------------

        invitation.status = "accepted"
        invitation.responded_at = datetime.now(
            timezone.utc
        )

        member = TeamMember(
            team_id=team.id,
            user_id=user_id,
            role="member",
        )

        db.add(member)

        await db.flush()

        # -------------------------------------------------
        # SYNCHRONIZE PARTICIPANT RECORDS
        # -------------------------------------------------

        for hackathon_id in registered_hackathon_ids:

            result = await db.execute(
                select(Participant).where(
                    Participant.user_id == user_id,
                    Participant.hackathon_id == hackathon_id,
                )
            )

            participant = result.scalar_one_or_none()

            if participant is None:

                participant = Participant(
                    user_id=user_id,
                    hackathon_id=hackathon_id,
                    team_id=team.id,
                    status="Joined",
                )

                db.add(participant)

            else:

                # The scheduler should already have rejected
                # an individual registration or another team.
                if participant.team_id != team.id:
                    await db.rollback()
                    return "ALREADY_REGISTERED"

                participant.status = "Joined"

        await db.flush()

        # -------------------------------------------------
        # NOTIFY TEAM OWNER
        # -------------------------------------------------

        await create_notification(
            db=db,
            user_id=team.owner_id,
            notification_type="team_invitation_accepted",
            title="Invitation Accepted",
            message=(
                f"{accepted_user.full_name} accepted your "
                f"invitation and joined '{team.name}'."
            ),
            action_url=(
                f"/dashboard/teams/{team.id}"
            ),
        )

        # Membership and Participant records are committed
        # together so they cannot be saved independently.
        await db.commit()
        await db.refresh(invitation)

        # -------------------------------------------------
        # AWARD COLLABORATOR ACHIEVEMENT
        # -------------------------------------------------

        await award_achievement(
            db=db,
            user_id=user_id,
            code="COLLABORATOR",
        )

        return invitation

    except Exception:
        await db.rollback()
        raise

