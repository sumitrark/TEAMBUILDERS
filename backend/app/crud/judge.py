from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.judge import Judge
from app.models.project import Project
from app.models.team import Team
from app.models.hackathon import Hackathon


# ============================================================
# GET JUDGE PROJECTS
# ============================================================

async def get_judge_projects(
    db: AsyncSession,
    judge_id: UUID,
    hackathon_id: UUID,
):
    # --------------------------------------------------------
    # Verify judge belongs to this hackathon
    # --------------------------------------------------------

    judge_result = await db.execute(
        select(Judge).where(
            Judge.user_id == judge_id,
            Judge.hackathon_id == hackathon_id,
            Judge.status.in_(["active", "accepted"]),
        )
    )

    judge = judge_result.scalar_one_or_none()

    if judge is None:
        return "NOT_ACTIVE_JUDGE"

    # --------------------------------------------------------
    # Get projects belonging to teams in this hackathon
    # --------------------------------------------------------

    result = await db.execute(
        select(Project)
        .join(
            Team,
            Project.team_id == Team.id,
        )
        .where(
            Team.hackathon_id == hackathon_id
        )
        .order_by(
            Project.created_at.desc()
        )
    )

    return result.scalars().all()


# ============================================================
# GET JUDGE STATUS
# ============================================================

async def get_judge_status(
    db: AsyncSession,
    judge_id: UUID,
    hackathon_id: UUID,
):
    result = await db.execute(
        select(Judge).where(
            Judge.user_id == judge_id,
            Judge.hackathon_id == hackathon_id,
        )
    )

    return result.scalar_one_or_none()


# ============================================================
# PENDING INVITATIONS (for the invited user, not the organizer)
# ============================================================

async def get_pending_invitations(
    db: AsyncSession,
    user_id: UUID,
):
    result = await db.execute(
        select(Judge, Hackathon)
        .join(
            Hackathon,
            Judge.hackathon_id == Hackathon.id,
        )
        .where(
            Judge.user_id == user_id,
            Judge.status == "invited",
        )
        .order_by(
            Judge.created_at.desc()
        )
    )

    rows = result.all()

    return [
        {
            "judge_id": judge.id,
            "hackathon_id": hackathon.id,
            "hackathon_title": hackathon.title,
            "status": judge.status,
            "created_at": judge.created_at,
        }
        for judge, hackathon in rows
    ]


# ============================================================
# ACCEPT / DECLINE A SPECIFIC INVITATION BY ID
#
# Distinct from the shared-code self-service accept flow in
# crud/organizer.py::accept_judge_invitation - this is for a
# Judge row that was created via the organizer's per-email
# invite_judge() and was stuck at status="invited" with no way
# to transition to "active" until now.
# ============================================================

async def accept_invitation_by_id(
    db: AsyncSession,
    judge_id: UUID,
    user_id: UUID,
):
    result = await db.execute(
        select(Judge).where(Judge.id == judge_id)
    )

    judge = result.scalar_one_or_none()

    if judge is None:
        return "NOT_FOUND"

    if judge.user_id != user_id:
        return "NOT_YOUR_INVITATION"

    if judge.status != "invited":
        return "NOT_PENDING"

    judge.status = "active"

    await db.commit()
    await db.refresh(judge)

    return judge


async def decline_invitation_by_id(
    db: AsyncSession,
    judge_id: UUID,
    user_id: UUID,
):
    result = await db.execute(
        select(Judge).where(Judge.id == judge_id)
    )

    judge = result.scalar_one_or_none()

    if judge is None:
        return "NOT_FOUND"

    if judge.user_id != user_id:
        return "NOT_YOUR_INVITATION"

    if judge.status != "invited":
        return "NOT_PENDING"

    judge.status = "declined"

    await db.commit()
    await db.refresh(judge)

    return judge