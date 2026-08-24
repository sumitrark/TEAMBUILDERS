from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment_transaction import PaymentTransaction


async def create_transaction(
    db: AsyncSession,
    *,
    user_id: UUID,
    plan_code: str,
    stripe_checkout_session_id: str | None,
    amount_cents: int | None,
    currency: str,
    status: str,
) -> PaymentTransaction:
    record = PaymentTransaction(
        user_id=user_id,
        plan_code=plan_code,
        stripe_checkout_session_id=stripe_checkout_session_id,
        amount_cents=amount_cents,
        currency=currency,
        status=status,
    )

    db.add(record)

    await db.commit()
    await db.refresh(record)

    return record


async def get_transaction_by_session_id(
    db: AsyncSession,
    session_id: str,
) -> PaymentTransaction | None:
    result = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.stripe_checkout_session_id == session_id
        )
    )

    return result.scalar_one_or_none()


async def update_transaction_status(
    db: AsyncSession,
    record: PaymentTransaction,
    *,
    status: str,
    stripe_payment_intent_id: str | None = None,
) -> PaymentTransaction:
    record.status = status

    if stripe_payment_intent_id:
        record.stripe_payment_intent_id = stripe_payment_intent_id

    await db.commit()
    await db.refresh(record)

    return record


async def get_user_transactions(
    db: AsyncSession,
    user_id: UUID,
):
    result = await db.execute(
        select(PaymentTransaction)
        .where(PaymentTransaction.user_id == user_id)
        .order_by(PaymentTransaction.created_at.desc())
    )

    return result.scalars().all()
