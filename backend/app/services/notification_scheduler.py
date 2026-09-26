from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hackathon import Hackathon
from app.models.participant import Participant
from app.models.notification import Notification
from app.crud.notification import create_notification
from app.services.hackathon_lifecycle import (
    get_hackathon_status,
    get_time_remaining_seconds,
)

# (threshold_seconds, marker, message) - marker is embedded in the
# notification's action_url as a dedup key, so calling this endpoint
# repeatedly (as a cron naturally would) never sends the same
# reminder twice.
TIME_REMAINING_THRESHOLDS = [
    (6 * 3600, "6h", "You have 6 hours remaining."),
    (3 * 3600, "3h", "You have 3 hours remaining."),
    (1 * 3600, "1h", "You have 1 hour remaining."),
    (30 * 60, "30m", "You have 30 minutes remaining."),
    (10 * 60, "10m", "You have 10 minutes remaining."),
    (5 * 60, "5m", "Submission closes in 5 minutes."),
]


async def _notification_already_sent(
    db: AsyncSession, user_id, action_url: str
) -> bool:
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == user_id,
            Notification.action_url == action_url,
        )
    )
    return result.scalar_one_or_none() is not None


async def dispatch_hackathon_reminders(db: AsyncSession) -> dict:
    """
    Meant to be called periodically by an external scheduler (cron,
    a platform's scheduled-job feature, etc.) - not a standing loop
    inside this process. Safe to call as often as needed and safe
    to run from multiple instances: every send is guarded by an
    idempotency check against action_url before inserting.
    """
    sent_counts = {
        "hackathon_started": 0,
        "time_remaining": 0,
        "submission_closed": 0,
    }

    result = await db.execute(select(Hackathon))
    hackathons = result.scalars().all()

    for hackathon in hackathons:
        lifecycle_status = get_hackathon_status(hackathon)

        if lifecycle_status not in ("LIVE", "COMPLETED"):
            continue

        participants_result = await db.execute(
            select(Participant).where(
                Participant.hackathon_id == hackathon.id
            )
        )
        participants = participants_result.scalars().all()

        workspace_url = f"/dashboard/hackathons/{hackathon.id}/workspace"

        if lifecycle_status == "LIVE":
            started_url = f"{workspace_url}?reminder=started"

            for participant in participants:
                if await _notification_already_sent(
                    db, participant.user_id, started_url
                ):
                    continue

                await create_notification(
                    db=db,
                    user_id=participant.user_id,
                    notification_type="HACKATHON_STARTED",
                    title="Hackathon Started",
                    message=(
                        f"'{hackathon.title}' has started. Good luck!"
                    ),
                    action_url=started_url,
                )
                sent_counts["hackathon_started"] += 1

            seconds_remaining = get_time_remaining_seconds(hackathon)

            if seconds_remaining is not None:
                for threshold, marker, message in TIME_REMAINING_THRESHOLDS:
                    if seconds_remaining > threshold:
                        continue

                    reminder_url = f"{workspace_url}?reminder={marker}"

                    for participant in participants:
                        if await _notification_already_sent(
                            db, participant.user_id, reminder_url
                        ):
                            continue

                        await create_notification(
                            db=db,
                            user_id=participant.user_id,
                            notification_type="TIME_REMAINING",
                            title="Time Remaining",
                            message=message,
                            action_url=reminder_url,
                        )
                        sent_counts["time_remaining"] += 1

        elif lifecycle_status == "COMPLETED":
            closed_url = f"{workspace_url}?reminder=closed"

            for participant in participants:
                if await _notification_already_sent(
                    db, participant.user_id, closed_url
                ):
                    continue

                await create_notification(
                    db=db,
                    user_id=participant.user_id,
                    notification_type="SUBMISSION_CLOSED",
                    title="Submission Closed",
                    message=(
                        f"Submission for '{hackathon.title}' is now closed."
                    ),
                    action_url=closed_url,
                )
                sent_counts["submission_closed"] += 1

    await db.commit()

    return sent_counts
