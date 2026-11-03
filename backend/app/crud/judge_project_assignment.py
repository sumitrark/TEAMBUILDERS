from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.judge import Judge
from app.models.judge_project_assignment import JudgeProjectAssignment
from app.models.project import Project
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.submission import Submission


async def assign_project_to_judge(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    judge_id: UUID,
    project_id: UUID,
):
    # --------------------------------------------------------
    # Verify the organizer owns the hackathon.
    # --------------------------------------------------------

    from app.models.hackathon import Hackathon

    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    hackathon = hackathon_result.scalar_one_or_none()

    if hackathon is None:
        return "HACKATHON_NOT_FOUND"

    # --------------------------------------------------------
    # Verify the judge belongs to this hackathon.
    # --------------------------------------------------------

    judge_result = await db.execute(
        select(Judge).where(
            Judge.id == judge_id,
            Judge.hackathon_id == hackathon_id,
            Judge.status.in_(["active", "accepted"]),
        )
    )

    judge = judge_result.scalar_one_or_none()

    if judge is None:
        return "JUDGE_NOT_FOUND"

    # --------------------------------------------------------
    # Verify the project belongs to this hackathon.
    # --------------------------------------------------------

    project_result = await db.execute(
        select(Project)
        .join(Team, Project.team_id == Team.id)
        .where(
            Project.id == project_id,
            Team.hackathon_id == hackathon_id,
        )
    )

    project = project_result.scalar_one_or_none()

    if project is None:
        return "PROJECT_NOT_FOUND"

    if project.team_id is None:
        return "PROJECT_HAS_NO_TEAM"

    # --------------------------------------------------------
    # Only submitted/finalized projects can be assigned.
    # --------------------------------------------------------

    submission_result = await db.execute(
        select(Submission)
        .where(
            Submission.project_id == project_id,
            Submission.status.in_(
                ["SUBMITTED", "LOCKED", "UNDER_REVIEW", "EVALUATED"]
            ),
        )
        .order_by(Submission.version_number.desc())
    )

    submission = submission_result.scalars().first()

    if submission is None:
        return "PROJECT_NOT_SUBMITTED"

    # --------------------------------------------------------
    # Prevent a judge from being assigned their own team's
    # project.
    # --------------------------------------------------------

    member_result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == project.team_id,
            TeamMember.user_id == judge.user_id,
        )
    )

    if member_result.scalar_one_or_none() is not None:
        return "SELF_ASSIGNMENT_NOT_ALLOWED"

    # --------------------------------------------------------
    # Prevent duplicate assignment.
    # --------------------------------------------------------

    existing_result = await db.execute(
        select(JudgeProjectAssignment).where(
            JudgeProjectAssignment.judge_id == judge_id,
            JudgeProjectAssignment.project_id == project_id,
        )
    )

    if existing_result.scalar_one_or_none() is not None:
        return "ALREADY_ASSIGNED"

    assignment = JudgeProjectAssignment(
        judge_id=judge_id,
        project_id=project_id,
    )

    db.add(assignment)

    await db.commit()
    await db.refresh(assignment)

    # --------------------------------------------------------
    # Notify the judge about the new assignment.
    # --------------------------------------------------------
    from app.crud.notification import create_notification
    from app.models.user import User

    user_result = await db.execute(
        select(User).where(User.id == judge.user_id)
    )
    judge_user = user_result.scalar_one_or_none()

    if judge_user is not None:
        try:
            await create_notification(
                db=db,
                user_id=judge_user.id,
                notification_type="judge_assignment",
                title="New Project Assigned",
                message=(
                    f"You have been assigned to evaluate \"{project.title}\" "
                    f"in {hackathon.title}."
                ),
                action_url=f"/judge/accept/projects/{project_id}?hackathon={hackathon_id}",
            )
        except Exception:
            pass  # Never let notification failure block the assignment

    return assignment


async def remove_project_assignment(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
    judge_id: UUID,
    project_id: UUID,
):
    from app.models.hackathon import Hackathon

    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    if hackathon_result.scalar_one_or_none() is None:
        return "HACKATHON_NOT_FOUND"

    judge_result = await db.execute(
        select(Judge).where(
            Judge.id == judge_id,
            Judge.hackathon_id == hackathon_id,
        )
    )

    if judge_result.scalar_one_or_none() is None:
        return "JUDGE_NOT_FOUND"

    result = await db.execute(
        select(JudgeProjectAssignment).where(
            JudgeProjectAssignment.judge_id == judge_id,
            JudgeProjectAssignment.project_id == project_id,
        )
    )

    assignment = result.scalar_one_or_none()

    if assignment is None:
        return "ASSIGNMENT_NOT_FOUND"

    await db.delete(assignment)
    await db.commit()

    return assignment


async def get_hackathon_assignments(
    db: AsyncSession,
    organizer_id: UUID,
    hackathon_id: UUID,
):
    from app.models.hackathon import Hackathon

    hackathon_result = await db.execute(
        select(Hackathon).where(
            Hackathon.id == hackathon_id,
            Hackathon.organizer_id == organizer_id,
        )
    )

    if hackathon_result.scalar_one_or_none() is None:
        return "HACKATHON_NOT_FOUND"

    result = await db.execute(
        select(JudgeProjectAssignment)
        .join(Judge, JudgeProjectAssignment.judge_id == Judge.id)
        .where(
            Judge.hackathon_id == hackathon_id,
        )
        .order_by(JudgeProjectAssignment.created_at.desc())
    )

    return result.scalars().all()