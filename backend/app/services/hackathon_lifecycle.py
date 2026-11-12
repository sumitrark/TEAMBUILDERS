
from datetime import datetime, time, timezone, timedelta

from app.models.hackathon import Hackathon


# DRAFT | UPCOMING | REGISTRATION_OPEN | REGISTRATION_CLOSED
# LIVE | COMPLETED | CANCELLED

LifecycleStatus = str

IST = timezone(timedelta(hours=5, minutes=30))


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        # Existing naive database timestamps are treated as UTC.
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def _date_to_start_of_day_utc(value) -> datetime:
    return datetime.combine(
        value,
        time.min,
        tzinfo=IST,
    ).astimezone(timezone.utc)


def _date_to_end_of_day_utc(value) -> datetime:
    return datetime.combine(
        value,
        time.max,
        tzinfo=IST,
    ).astimezone(timezone.utc)


def _registration_start(hackathon: Hackathon) -> datetime:
    if hackathon.registration_start:
        return _as_utc(hackathon.registration_start)

    if hackathon.created_at:
        return _as_utc(hackathon.created_at)

    if hackathon.start_date:
        return _date_to_start_of_day_utc(hackathon.start_date)

    return datetime.min.replace(tzinfo=timezone.utc)


def _registration_end(hackathon: Hackathon) -> datetime:
    if hackathon.registration_end:
        return _as_utc(hackathon.registration_end)

    if hackathon.registration_deadline:
        return _date_to_end_of_day_utc(
            hackathon.registration_deadline
        )

    return _hackathon_start(hackathon)


def _hackathon_start(hackathon: Hackathon) -> datetime:
    if hackathon.hackathon_start:
        return _as_utc(hackathon.hackathon_start)

    if hackathon.start_date:
        return _date_to_start_of_day_utc(
            hackathon.start_date
        )

    if hackathon.created_at:
        return _as_utc(hackathon.created_at)

    return datetime.min.replace(tzinfo=timezone.utc)


def _hackathon_end(hackathon: Hackathon) -> datetime:
    if hackathon.hackathon_end:
        return _as_utc(hackathon.hackathon_end)

    if hackathon.end_date:
        return _date_to_end_of_day_utc(
            hackathon.end_date
        )

    return _hackathon_start(hackathon)


def get_hackathon_status(hackathon: Hackathon) -> LifecycleStatus:
    """
    Single source of truth for hackathon lifecycle status.
    Explicit timestamps take priority over date-only fields.
    Date-only fallbacks use Indian Standard Time.
    """

    if hackathon.status == "Cancelled":
        return "CANCELLED"

    if not hackathon.is_active:
        return "DRAFT"

    now = datetime.now(timezone.utc)

    reg_start = _registration_start(hackathon)
    reg_end = _registration_end(hackathon)
    h_start = _hackathon_start(hackathon)
    h_end = _hackathon_end(hackathon)

    if now < reg_start:
        return "UPCOMING"

    if now >= h_end:
        return "COMPLETED"

    if now >= h_start:
        return "LIVE"

    if now < reg_end:
        return "REGISTRATION_OPEN"

    return "REGISTRATION_CLOSED"


def is_registration_open(hackathon: Hackathon) -> bool:
    return (
        get_hackathon_status(hackathon)
        == "REGISTRATION_OPEN"
    )


def is_hackathon_live(hackathon: Hackathon) -> bool:
    return get_hackathon_status(hackathon) == "LIVE"


def is_hackathon_finished(hackathon: Hackathon) -> bool:
    return get_hackathon_status(hackathon) in (
        "COMPLETED",
        "CANCELLED",
    )


def is_submission_open(hackathon: Hackathon) -> bool:
    return is_hackathon_live(hackathon)


def get_time_remaining_seconds(
    hackathon: Hackathon,
) -> int | None:
    """
    Seconds until the next lifecycle boundary.
    Returns None once the hackathon has finished.
    """

    status = get_hackathon_status(hackathon)
    now = datetime.now(timezone.utc)

    if status == "UPCOMING":
        target = _registration_start(hackathon)

    elif status == "REGISTRATION_OPEN":
        target = _registration_end(hackathon)

    elif status == "REGISTRATION_CLOSED":
        target = _hackathon_start(hackathon)

    elif status == "LIVE":
        target = _hackathon_end(hackathon)

    else:
        return None

    remaining = (target - now).total_seconds()

    return max(int(remaining), 0)
