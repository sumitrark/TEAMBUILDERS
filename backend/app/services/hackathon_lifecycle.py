from datetime import datetime, time, timezone

from app.models.hackathon import Hackathon

# DRAFT | UPCOMING | REGISTRATION_OPEN | REGISTRATION_CLOSED | LIVE
# | COMPLETED | CANCELLED
LifecycleStatus = str


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _date_to_start_of_day_utc(value) -> datetime:
    return datetime.combine(value, time.min, tzinfo=timezone.utc)


def _date_to_end_of_day_utc(value) -> datetime:
    return datetime.combine(value, time(23, 59, 59), tzinfo=timezone.utc)


def _registration_start(hackathon: Hackathon) -> datetime:
    if hackathon.registration_start:
        return _as_utc(hackathon.registration_start)
    return _as_utc(hackathon.created_at)


def _registration_end(hackathon: Hackathon) -> datetime:
    if hackathon.registration_end:
        return _as_utc(hackathon.registration_end)
    return _date_to_end_of_day_utc(hackathon.registration_deadline)


def _hackathon_start(hackathon: Hackathon) -> datetime:
    if hackathon.hackathon_start:
        return _as_utc(hackathon.hackathon_start)
    return _date_to_start_of_day_utc(hackathon.start_date)


def _hackathon_end(hackathon: Hackathon) -> datetime:
    if hackathon.hackathon_end:
        return _as_utc(hackathon.hackathon_end)
    return _date_to_end_of_day_utc(hackathon.end_date)


def get_hackathon_status(hackathon: Hackathon) -> LifecycleStatus:
    """
    The single source of truth for hackathon lifecycle state. Never
    trust a frontend-supplied status - every enforcement decision
    (registration, submission, evaluation) must go through this.
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

    # Hackathon start/end always take precedence over the
    # registration window once reached - if the event has actually
    # started or ended by clock time, that's authoritative even if
    # registration_end was configured to overlap it (e.g. an
    # organizer allowing late registration during the event itself).
    if now >= h_end:
        return "COMPLETED"

    if now >= h_start:
        return "LIVE"

    if now < reg_end:
        return "REGISTRATION_OPEN"

    return "REGISTRATION_CLOSED"


def is_registration_open(hackathon: Hackathon) -> bool:
    return get_hackathon_status(hackathon) == "REGISTRATION_OPEN"


def is_hackathon_live(hackathon: Hackathon) -> bool:
    return get_hackathon_status(hackathon) == "LIVE"


def is_hackathon_finished(hackathon: Hackathon) -> bool:
    return get_hackathon_status(hackathon) in ("COMPLETED", "CANCELLED")


def is_submission_open(hackathon: Hackathon) -> bool:
    # Submissions are only accepted while the hackathon is actually
    # LIVE - not during registration, not after hackathon_end.
    return is_hackathon_live(hackathon)


def get_time_remaining_seconds(hackathon: Hackathon) -> int | None:
    """
    Seconds until the next relevant boundary (registration opening,
    hackathon starting, or hackathon ending), for frontend countdowns.
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

