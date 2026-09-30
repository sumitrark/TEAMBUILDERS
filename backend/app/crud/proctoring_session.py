from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.participant import get_participant
from app.models.proctoring_session import ProctoringSession


async def start_proctoring_session(
    db: AsyncSession,
    user_id: UUID,
    hackathon_id: UUID,
):
    participant = await get_participant(
        db,
        user_id,
        hackathon_id,
    )

    if participant is None:
        return "NOT_PARTICIPANT"

    now = datetime.now(timezone.utc)

    # Close any previous active session for this participant/hackathon.
    await db.execute(
        update(ProctoringSession)
        .where(
            ProctoringSession.participant_id == participant.id,
            ProctoringSession.hackathon_id == hackathon_id,
            ProctoringSession.active.is_(True),
        )
        .values(
            active=False,
            ended_at=now,
            end_reason="SESSION_RESTARTED",
        )
    )

    session = ProctoringSession(
        participant_id=participant.id,
        user_id=user_id,
        hackathon_id=hackathon_id,
        started_at=now,
        last_heartbeat_at=now,
        active=True,
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return session


async def heartbeat_proctoring_session(
    db: AsyncSession,
    user_id: UUID,
    session_id: UUID,
):
    result = await db.execute(
        select(ProctoringSession).where(
            ProctoringSession.id == session_id,
            ProctoringSession.user_id == user_id,
            ProctoringSession.active.is_(True),
        )
    )

    session = result.scalar_one_or_none()

    if session is None:
        return "SESSION_NOT_FOUND"

    session.last_heartbeat_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(session)

    return session


async def stop_proctoring_session(
    db: AsyncSession,
    user_id: UUID,
    session_id: UUID,
    end_reason: str,
):
    result = await db.execute(
        select(ProctoringSession).where(
            ProctoringSession.id == session_id,
            ProctoringSession.user_id == user_id,
            ProctoringSession.active.is_(True),
        )
    )

    session = result.scalar_one_or_none()

    if session is None:
        return "SESSION_NOT_FOUND"

    session.active = False
    session.ended_at = datetime.now(timezone.utc)
    session.end_reason = end_reason

    await db.commit()
    await db.refresh(session)

    return session