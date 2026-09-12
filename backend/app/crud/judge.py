from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.judge import Judge
from app.models.project import Project
from app.models.team import Team
from app.models.hackathon import Hackathon
from app.models.user import User
from app.crud.notification import create_notification


# ============================================================
# GET JUDGE PROJECTS
# ============================================================

def _to_judge_project_response(project: Project) -> dict:
    """
    Builds the exact, minimal shape judges are allowed to see - never
    the raw ORM object, so there's no risk of an unrelated field
    (owner_id, team name via a future join, etc.) leaking through.
    """
    team_display_id = None

    if project.team_id:
        team_display_id = f"TEAM-{str(project.team_id)[:6].upper()}"

    return {
        "id": project.id,
        "title": project.title,
        "description": project.description,
        "tech_stack": project.tech_stack,
        "github_url": project.github_url,
        "demo_url": project.demo_url,
        "team_id": project.team_id,
        "ai_tools_used": project.ai_tools_used,
        "team_display_id": team_display_id,
        "created_at": project.created_at,
    }


async def get_judge_projects(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
):
    # --------------------------------------------------------
    # Verify judge belongs to this hackathon
    # --------------------------------------------------------

    judge_result = await db.execute(
        select(Judge).where(
            Judge.user_id == user_id,
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

    projects = result.scalars().all()

    return [_to_judge_project_response(p) for p in projects]


# ============================================================
# SINGLE PROJECT DETAIL (previously missing - the frontend detail
# page called GET /judge/hackathons/{id}/projects/{project_id},
# which had no matching route and always 404'd)
# ============================================================

async def get_judge_project(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
    project_id: UUID,
):
    judge_result = await db.execute(
        select(Judge).where(
            Judge.user_id == user_id,
            Judge.hackathon_id == hackathon_id,
            Judge.status.in_(["active", "accepted"]),
        )
    )

    if judge_result.scalar_one_or_none() is None:
        return "NOT_ACTIVE_JUDGE"

    result = await db.execute(
        select(Project)
        .join(Team, Project.team_id == Team.id)
        .where(
            Project.id == project_id,
            Team.hackathon_id == hackathon_id,
        )
    )

    project = result.scalar_one_or_none()

    if project is None:
        return "PROJECT_NOT_FOUND"

    return _to_judge_project_response(project)


# ============================================================
# MY ASSIGNED HACKATHONS (Judge Portal dashboard)
# ============================================================

async def get_my_judge_hackathons(
    db: AsyncSession,
    user_id: UUID,
):
    from app.models.evaluation import Evaluation

    judge_result = await db.execute(
        select(Judge, Hackathon)
        .join(Hackathon, Judge.hackathon_id == Hackathon.id)
        .where(
            Judge.user_id == user_id,
            Judge.status.in_(["active", "accepted"]),
        )
        .order_by(Hackathon.created_at.desc())
    )

    rows = judge_result.all()
    output = []

    for judge, hackathon in rows:
        total_result = await db.execute(
            select(Project)
            .join(Team, Project.team_id == Team.id)
            .where(Team.hackathon_id == hackathon.id)
        )
        total_projects = len(total_result.scalars().all())

        evaluated_result = await db.execute(
            select(Evaluation)
            .join(Project, Evaluation.project_id == Project.id)
            .join(Team, Project.team_id == Team.id)
            .where(
                Team.hackathon_id == hackathon.id,
                Evaluation.judge_id == user_id,
            )
        )
        evaluated_count = len(evaluated_result.scalars().all())

        output.append(
            {
                "hackathon_id": hackathon.id,
                "title": hackathon.title,
                "description": hackathon.description,
                "status": hackathon.status,
                "total_projects": total_projects,
                "evaluated_count": evaluated_count,
                "pending_count": total_projects - evaluated_count,
            }
        )

    return output


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

    await db.flush()

    await _notify_organizer_of_response(db, judge, accepted=True)

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

    await db.flush()

    await _notify_organizer_of_response(db, judge, accepted=False)

    await db.commit()
    await db.refresh(judge)

    return judge


async def _notify_organizer_of_response(
    db: AsyncSession,
    judge: Judge,
    accepted: bool,
) -> None:
    hackathon_result = await db.execute(
        select(Hackathon).where(Hackathon.id == judge.hackathon_id)
    )
    hackathon = hackathon_result.scalar_one_or_none()

    if not hackathon or not hackathon.organizer_id:
        return

    judge_user_result = await db.execute(
        select(User).where(User.id == judge.user_id)
    )
    judge_user = judge_user_result.scalar_one_or_none()

    judge_name = judge_user.full_name if judge_user else "A judge"

    await create_notification(
        db=db,
        user_id=hackathon.organizer_id,
        notification_type=(
            "judge_acceptance" if accepted else "judge_decline"
        ),
        title=(
            "Judge Invitation Accepted"
            if accepted
            else "Judge Invitation Declined"
        ),
        message=(
            f"{judge_name} {'accepted' if accepted else 'declined'} "
            f"the invitation to judge '{hackathon.title}'."
        ),
        action_url=f"/organizer/hackathons/{hackathon.id}/judges",
    )