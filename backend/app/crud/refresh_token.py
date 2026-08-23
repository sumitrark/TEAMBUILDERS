from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


async def create_refresh_token_record(
    db: AsyncSession,
    user_id: UUID,
    token_hash: str,
    expires_at: datetime,
) -> RefreshToken:
    record = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    db.add(record)

    await db.commit()

    await db.refresh(record)

    return record


async def get_refresh_token_by_hash(
    db: AsyncSession,
    token_hash: str,
) -> RefreshToken | None:
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash
        )
    )

    return result.scalar_one_or_none()


async def revoke_refresh_token(
    db: AsyncSession,
    record: RefreshToken,
    replaced_by_token_hash: str | None = None,
) -> None:
    record.revoked_at = datetime.now(timezone.utc)
    record.replaced_by_token_hash = replaced_by_token_hash

    await db.commit()


async def revoke_all_refresh_tokens_for_user(
    db: AsyncSession,
    user_id: UUID,
) -> None:
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
    )

    now = datetime.now(timezone.utc)

    for record in result.scalars().all():
        record.revoked_at = now

    await db.commit()
