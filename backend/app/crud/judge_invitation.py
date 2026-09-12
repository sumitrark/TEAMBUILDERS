from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.judge_invitation import JudgeInvitation, _generate_token, _default_expiry
from app.models.judge import Judge
from app.models.hackathon import Hackathon
from app.models.user import User
from app.crud.notification import create_notification


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _is_expired(invitation: JudgeInvitation) -> bool:
    return datetime.now(timezone.utc) > _as_utc(invitation.expires_at)


async def _lazily_expire(
    db: AsyncSession,
    invitation: JudgeInvitation,
) -> JudgeInvitation:
    """
    We don't run a background job to sweep expired invitations, so
    expiry is evaluated lazily on read/write: any pending invitation
    past its expires_at is treated (and persisted) as expired the
    moment something touches it.
    """
    if invitation.status == "pending" and _is_expired(invitation):
        invitation.status = "expired"
        await db.commit()
        await db.refresh(invitation)

    return invitation


# ============================================================
# LOOKUPS
# ============================================================

async def get_pending_invitation_for_hackathon_email(
    db: AsyncSession,
    hackathon_id: UUID,
    email: str,
) -> JudgeInvitation | None:
    result = await db.execute(
        select(JudgeInvitation).where(
            JudgeInvitation.hackathon_id == hackathon_id,
            JudgeInvitation.invited_email == email.lower(),
            JudgeInvitation.status == "pending",
        )
    )

    invitation = result.scalar_one_or_none()

    if invitation:
        invitation = await _lazily_expire(db, invitation)
        if invitation.status != "pending":
            return None

    return invitation


async def get_invitation_by_token(
    db: AsyncSession,
    token: str,
) -> JudgeInvitation | None:
    result = await db.execute(
        select(JudgeInvitation).where(JudgeInvitation.token == token)
    )

    invitation = result.scalar_one_or_none()

    if invitation:
        invitation = await _lazily_expire(db, invitation)

    return invitation


async def get_invitation_by_id(
    db: AsyncSession,
    invitation_id: UUID,
) -> JudgeInvitation | None:
    result = await db.execute(
        select(JudgeInvitation).where(JudgeInvitation.id == invitation_id)
    )

    invitation = result.scalar_one_or_none()

    if invitation:
        invitation = await _lazily_expire(db, invitation)

    return invitation


async def get_hackathon_invitations(
    db: AsyncSession,
    hackathon_id: UUID,
):
    result = await db.execute(
        select(JudgeInvitation)
        .where(JudgeInvitation.hackathon_id == hackathon_id)
        .order_by(JudgeInvitation.created_at.desc())
    )

    invitations = result.scalars().all()

    for invitation in invitations:
        await _lazily_expire(db, invitation)

    return invitations


async def get_pending_invitations_for_user(
    db: AsyncSession,
    user_id: UUID,
    email: str,
):
    result = await db.execute(
        select(JudgeInvitation, Hackathon, User)
        .join(Hackathon, JudgeInvitation.hackathon_id == Hackathon.id)
        .join(User, JudgeInvitation.organizer_id == User.id)
        .where(
            (JudgeInvitation.invited_user_id == user_id)
            | (JudgeInvitation.invited_email == email.lower()),
            JudgeInvitation.status == "pending",
        )
        .order_by(JudgeInvitation.created_at.desc())
    )

    rows = result.all()

    output = []

    for invitation, hackathon, organizer in rows:
        invitation = await _lazily_expire(db, invitation)

        if invitation.status != "pending":
            continue

        output.append(
            {
                "invitation_id": invitation.id,
                "hackathon_id": hackathon.id,
                "hackathon_title": hackathon.title,
                "organizer_name": organizer.full_name,
                "status": invitation.status,
                "created_at": invitation.created_at,
                "expires_at": invitation.expires_at,
            }
        )

    return output


# ============================================================
# CREATE / RESEND / CANCEL (organizer side)
# ============================================================

async def create_invitation(
    db: AsyncSession,
    hackathon_id: UUID,
    organizer_id: UUID,
    email: str,
) -> JudgeInvitation:
    normalized_email = email.lower().strip()

    result = await db.execute(
        select(User).where(User.email == normalized_email)
    )
    existing_user = result.scalar_one_or_none()

    invitation = JudgeInvitation(
        hackathon_id=hackathon_id,
        organizer_id=organizer_id,
        invited_email=normalized_email,
        invited_user_id=existing_user.id if existing_user else None,
    )

    db.add(invitation)

    await db.flush()

    if existing_user:
        hackathon_result = await db.execute(
            select(Hackathon).where(Hackathon.id == hackathon_id)
        )
        hackathon = hackathon_result.scalar_one_or_none()

        await create_notification(
            db=db,
            user_id=existing_user.id,
            notification_type="judge_invitation",
            title="New Judge Invitation",
            message=(
                f"You have been invited to judge "
                f"'{hackathon.title if hackathon else 'a hackathon'}'."
            ),
            action_url="/dashboard/invitations",
        )

    await db.commit()
    await db.refresh(invitation)

    return invitation


async def resend_invitation(
    db: AsyncSession,
    invitation: JudgeInvitation,
) -> JudgeInvitation:
    invitation.token = _generate_token()
    invitation.expires_at = _default_expiry()
    invitation.status = "pending"

    await db.commit()
    await db.refresh(invitation)

    if invitation.invited_user_id:
        hackathon_result = await db.execute(
            select(Hackathon).where(Hackathon.id == invitation.hackathon_id)
        )
        hackathon = hackathon_result.scalar_one_or_none()

        await create_notification(
            db=db,
            user_id=invitation.invited_user_id,
            notification_type="judge_invitation",
            title="Judge Invitation Resent",
            message=(
                f"Your invitation to judge "
                f"'{hackathon.title if hackathon else 'a hackathon'}' "
                f"has been resent."
            ),
            action_url="/dashboard/invitations",
        )

    return invitation


async def cancel_invitation(
    db: AsyncSession,
    invitation: JudgeInvitation,
) -> JudgeInvitation:
    invitation.status = "cancelled"

    await db.commit()
    await db.refresh(invitation)

    return invitation


# ============================================================
# ACCEPT / DECLINE (invited person side)
# ============================================================

async def accept_invitation(
    db: AsyncSession,
    invitation: JudgeInvitation,
    user: User,
):
    if user.email.lower() != invitation.invited_email.lower():
        return "EMAIL_MISMATCH"

    if invitation.status == "accepted":
        return "ALREADY_ACCEPTED"

    if invitation.status != "pending":
        return "NOT_PENDING"

    if _is_expired(invitation):
        invitation.status = "expired"
        await db.commit()
        return "EXPIRED"

    # Create (or reactivate) the Judge assignment row
    result = await db.execute(
        select(Judge).where(
            Judge.hackathon_id == invitation.hackathon_id,
            Judge.user_id == user.id,
        )
    )
    judge = result.scalar_one_or_none()

    if judge is None:
        judge = Judge(
            hackathon_id=invitation.hackathon_id,
            user_id=user.id,
            status="active",
        )
        db.add(judge)
    else:
        judge.status = "active"

    invitation.status = "accepted"
    invitation.accepted_at = datetime.now(timezone.utc)
    invitation.invited_user_id = user.id

    await db.flush()

    await _notify_organizer(db, invitation, user, accepted=True)

    await db.commit()
    await db.refresh(invitation)
    await db.refresh(judge)

    return invitation


async def decline_invitation(
    db: AsyncSession,
    invitation: JudgeInvitation,
    user: User,
):
    if user.email.lower() != invitation.invited_email.lower():
        return "EMAIL_MISMATCH"

    if invitation.status != "pending":
        return "NOT_PENDING"

    if _is_expired(invitation):
        invitation.status = "expired"
        await db.commit()
        return "EXPIRED"

    invitation.status = "declined"
    invitation.declined_at = datetime.now(timezone.utc)
    invitation.invited_user_id = user.id

    await db.flush()

    await _notify_organizer(db, invitation, user, accepted=False)

    await db.commit()
    await db.refresh(invitation)

    return invitation


async def _notify_organizer(
    db: AsyncSession,
    invitation: JudgeInvitation,
    responding_user: User,
    accepted: bool,
) -> None:
    hackathon_result = await db.execute(
        select(Hackathon).where(Hackathon.id == invitation.hackathon_id)
    )
    hackathon = hackathon_result.scalar_one_or_none()

    await create_notification(
        db=db,
        user_id=invitation.organizer_id,
        notification_type=(
            "judge_invitation_accepted"
            if accepted
            else "judge_invitation_declined"
        ),
        title=(
            "Judge Invitation Accepted"
            if accepted
            else "Judge Invitation Declined"
        ),
        message=(
            f"{responding_user.full_name} "
            f"{'accepted' if accepted else 'declined'} the invitation "
            f"to judge '{hackathon.title if hackathon else 'your hackathon'}'."
        ),
        action_url=(
            f"/organizer/hackathons/{invitation.hackathon_id}/judges"
        ),
    )
