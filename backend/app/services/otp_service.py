import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud.otp import get_active_otp, increment_attempts, mark_verified, upsert_otp
from app.models.user import User
from app.services.sms_service import send_sms_otp

PHONE_VERIFICATION_PURPOSE = "phone_verification"


def _hash_otp(otp: str, salt: str) -> str:
    # A 6-digit OTP has too little entropy for a hash alone to resist
    # offline brute force once a DB row is known - a full rainbow
    # table over all 1,000,000 possibilities takes well under a
    # second to build. The salt here is only to stop one precomputed
    # table from being reused across every user's rows; the real
    # protection is the short expiry and the attempt limit below,
    # both enforced online against this same row.
    return hashlib.sha256(f"{otp}{salt}".encode("utf-8")).hexdigest()


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


async def request_otp(
    db: AsyncSession,
    user: User,
    mobile_number: str,
    purpose: str = PHONE_VERIFICATION_PURPOSE,
) -> dict:

    now = datetime.now(timezone.utc)

    existing = await get_active_otp(db, user.id, purpose)

    reset_window = True

    if existing:
        last_sent = _as_utc(existing.last_sent_at)
        window_started = _as_utc(existing.window_started_at)

        cooldown_end = last_sent + timedelta(
            seconds=settings.OTP_RESEND_COOLDOWN_SECONDS
        )

        if now < cooldown_end:
            retry_after = max(int((cooldown_end - now).total_seconds()), 1)
            raise ValueError(
                f"Please wait {retry_after}s before requesting another OTP"
            )

        window_end = window_started + timedelta(
            minutes=settings.OTP_RATE_LIMIT_WINDOW_MINUTES
        )

        if now < window_end:
            reset_window = False

            if existing.send_count >= settings.OTP_MAX_SENDS_PER_WINDOW:
                raise ValueError(
                    "Too many OTP requests. Please try again later."
                )

    otp = f"{secrets.randbelow(1_000_000):06d}"
    salt = secrets.token_hex(16)
    otp_hash = _hash_otp(otp, salt)
    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    await upsert_otp(
        db,
        user_id=user.id,
        purpose=purpose,
        mobile_number=mobile_number,
        otp_hash=otp_hash,
        salt=salt,
        expires_at=expires_at,
        now=now,
        reset_window=reset_window,
    )

    # Store the pending number on the user record. It only becomes
    # "verified" once verify_otp() below succeeds; changing the
    # target number always resets verification status.
    user.mobile_number = mobile_number
    user.phone_verified = False

    await db.commit()

    await send_sms_otp(mobile_number, otp)

    return {
        "message": "OTP sent",
        "expires_in_seconds": settings.OTP_EXPIRE_MINUTES * 60,
        "resend_available_in_seconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
    }


async def verify_otp(
    db: AsyncSession,
    user: User,
    otp: str,
    purpose: str = PHONE_VERIFICATION_PURPOSE,
) -> dict:

    record = await get_active_otp(db, user.id, purpose)

    if not record:
        raise ValueError("No OTP request found. Please request a new OTP.")

    if record.verified_at is not None:
        raise ValueError(
            "This OTP has already been used. Please request a new OTP."
        )

    now = datetime.now(timezone.utc)
    expires_at = _as_utc(record.expires_at)

    if now > expires_at:
        raise ValueError("OTP has expired. Please request a new OTP.")

    if record.attempts >= record.max_attempts:
        raise ValueError(
            "Too many incorrect attempts. Please request a new OTP."
        )

    expected_hash = _hash_otp(otp, record.salt)

    if not secrets.compare_digest(expected_hash, record.otp_hash):
        await increment_attempts(db, record)

        remaining = max(record.max_attempts - record.attempts, 0)

        raise ValueError(
            f"Incorrect OTP. {remaining} attempt(s) remaining."
        )

    await mark_verified(db, record, verified_at=now)

    user.phone_verified = True

    await db.commit()

    return {"message": "Mobile number verified successfully"}
