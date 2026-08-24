import logging
from uuid import UUID

import stripe
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.plans import PLANS

from app.crud.payment import (
    create_transaction,
    get_transaction_by_session_id,
    get_user_transactions,
    update_transaction_status,
)
from app.crud.user import get_user_by_id

from app.models.user import User

logger = logging.getLogger("app.payments")


class PaymentsNotConfiguredError(Exception):
    """No STRIPE_SECRET_KEY is set. Callers must surface this clearly
    rather than pretending a checkout succeeded."""


class PaymentError(Exception):
    """Stripe was called but returned an error, or a webhook payload
    failed verification."""


def _require_stripe() -> None:
    if not settings.STRIPE_SECRET_KEY:
        raise PaymentsNotConfiguredError(
            "Payments are not configured on this server yet. "
            "Set STRIPE_SECRET_KEY to enable them."
        )

    stripe.api_key = settings.STRIPE_SECRET_KEY


# =========================================================
# CHECKOUT
# =========================================================

async def create_checkout_session(
    db: AsyncSession,
    user: User,
    plan_code: str,
    success_url: str,
    cancel_url: str,
) -> dict:
    _require_stripe()

    plan = PLANS.get(plan_code)

    if not plan or not plan.get("purchasable") or not plan.get("stripe_price_id"):
        raise ValueError(
            "This plan is not available for self-service checkout."
        )

    try:
        session = await stripe.checkout.Session.create_async(
            mode="subscription",
            line_items=[
                {"price": plan["stripe_price_id"], "quantity": 1}
            ],
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user.email,
            client_reference_id=str(user.id),
            metadata={
                "user_id": str(user.id),
                "plan_code": plan_code,
            },
        )

    except stripe.StripeError as exc:
        logger.error("Stripe checkout session creation failed: %s", exc)
        raise PaymentError(
            "Could not start checkout. Please try again."
        ) from exc

    await create_transaction(
        db,
        user_id=user.id,
        plan_code=plan_code,
        stripe_checkout_session_id=session.id,
        amount_cents=plan["price_cents"],
        currency=plan["currency"],
        status="pending",
    )

    return {
        "checkout_url": session.url,
        "session_id": session.id,
    }


# =========================================================
# PAYMENT HISTORY
# =========================================================

async def get_payment_history(db: AsyncSession, user_id: UUID):
    return await get_user_transactions(db, user_id)


# =========================================================
# WEBHOOK
#
# The frontend is never trusted to report payment success -
# every status change comes from a signature-verified Stripe
# webhook event.
# =========================================================

async def handle_webhook_event(
    db: AsyncSession,
    payload: bytes,
    sig_header: str,
) -> dict:
    _require_stripe()

    if not settings.STRIPE_WEBHOOK_SECRET:
        raise PaymentsNotConfiguredError(
            "STRIPE_WEBHOOK_SECRET is not set - cannot verify webhook "
            "signatures."
        )

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )

    except (ValueError, stripe.SignatureVerificationError) as exc:
        raise PaymentError("Invalid webhook signature") from exc

    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(db, data_object)

    elif event_type == "checkout.session.expired":
        await _handle_checkout_expired(db, data_object)

    elif event_type == "payment_intent.payment_failed":
        await _handle_payment_failed(db, data_object)

    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_deleted(db, data_object)

    else:
        logger.info("Unhandled Stripe event type: %s", event_type)

    return {"handled": event_type}


async def _handle_checkout_completed(db: AsyncSession, session_obj: dict) -> None:
    session_id = getattr(session_obj, "id", None)

    transaction = await get_transaction_by_session_id(db, session_id)

    if not transaction:
        logger.warning(
            "checkout.session.completed for unknown session %s", session_id
        )
        return

    await update_transaction_status(
        db,
        transaction,
        status="succeeded",
        stripe_payment_intent_id=getattr(session_obj, "payment_intent", None),
    )

    user = await get_user_by_id(db, transaction.user_id)

    if user:
        user.subscription_plan = transaction.plan_code
        user.subscription_status = "active"

        customer_id = getattr(session_obj, "customer", None)
        if customer_id:
            user.stripe_customer_id = customer_id

        await db.commit()


async def _handle_checkout_expired(db: AsyncSession, session_obj: dict) -> None:
    session_id = getattr(session_obj, "id", None)

    transaction = await get_transaction_by_session_id(db, session_id)

    if transaction and transaction.status == "pending":
        await update_transaction_status(db, transaction, status="canceled")


async def _handle_payment_failed(db: AsyncSession, payment_intent_obj: dict) -> None:
    payment_intent_id = getattr(payment_intent_obj, "id", None)

    # payment_intent.payment_failed doesn't carry our checkout session
    # id directly - we only have what Stripe gives us, so this is
    # logged for now rather than matched to a specific transaction.
    logger.warning(
        "Payment failed for payment_intent %s", payment_intent_id
    )


async def _handle_subscription_deleted(db: AsyncSession, subscription_obj: dict) -> None:
    customer_id = getattr(subscription_obj, "customer", None)

    if not customer_id:
        return

    from sqlalchemy import select

    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )

    user = result.scalar_one_or_none()

    if user:
        user.subscription_plan = "free"
        user.subscription_status = "canceled"
        await db.commit()
