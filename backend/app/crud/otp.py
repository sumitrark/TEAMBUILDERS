from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.otp_verification import OtpVerification


async def get_active_otp(
    db: AsyncSession,
    user_id: UUID,
    purpose: str,
) -> OtpVerification | None:
    result = await db.execute(
        select(OtpVerification).where(
            OtpVerification.user_id == user_id,
            OtpVerification.purpose == purpose,
        )
    )

    return result.scalar_one_or_none()


async def upsert_otp(
    db: AsyncSession,
    *,
    user_id: UUID,
    purpose: str,
    mobile_number: str,
    otp_hash: str,
    salt: str,
    expires_at: datetime,
    now: datetime,
    reset_window: bool,
) -> OtpVerification:
    record = await get_active_otp(db, user_id, purpose)

    if record is None:
        record = OtpVerification(
            user_id=user_id,
            purpose=purpose,
            mobile_number=mobile_number,
            otp_hash=otp_hash,
            salt=salt,
            expires_at=expires_at,
            attempts=0,
            send_count=1,
            window_started_at=now,
            last_sent_at=now,
        )
        db.add(record)

    else:
        record.mobile_number = mobile_number
        record.otp_hash = otp_hash
        record.salt = salt
        record.expires_at = expires_at
        record.attempts = 0
        record.verified_at = None
        record.last_sent_at = now

        if reset_window:
            record.window_started_at = now
            record.send_count = 1
        else:
            record.send_count += 1

    await db.commit()
    await db.refresh(record)

    return record


async def increment_attempts(
    db: AsyncSession,
    record: OtpVerification,
) -> None:
    record.attempts += 1

    await db.commit()
    await db.refresh(record)


async def mark_verified(
    db: AsyncSession,
    record: OtpVerification,
    verified_at: datetime,
) -> None:
    record.verified_at = verified_at

    await db.commit()
