from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies.current_user import get_current_user
from app.core.config import settings
from app.core.plans import PLANS

from app.schemas.payment import (
    CheckoutRequest,
    CheckoutResponse,
    PaymentTransactionResponse,
    PlanResponse,
    SubscriptionResponse,
)

from app.crud.payment import get_user_transactions

from app.services.payment_service import (
    PaymentError,
    PaymentsNotConfiguredError,
    create_checkout_session,
    handle_webhook_event,
)

router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


@router.get(
    "/plans",
    response_model=list[PlanResponse],
)
async def list_plans():
    return [
        {
            "code": code,
            "name": plan["name"],
            "price_cents": plan["price_cents"],
            "currency": plan["currency"],
            "interval": plan["interval"],
            "purchasable": plan["purchasable"],
            "features": plan["features"],
        }
        for code, plan in PLANS.items()
    ]


@router.get(
    "/subscription",
    response_model=SubscriptionResponse,
)
async def my_subscription(
    current_user=Depends(get_current_user),
):
    return {
        "plan": current_user.subscription_plan or "free",
        "status": current_user.subscription_status,
    }


@router.get(
    "/history",
    response_model=list[PaymentTransactionResponse],
)
async def payment_history(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await get_user_transactions(db, current_user.id)


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
)
async def checkout(
    payload: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        result = await create_checkout_session(
            db,
            current_user,
            payload.plan_code,
            success_url=f"{settings.FRONTEND_URL}/dashboard/billing?status=success",
            cancel_url=f"{settings.FRONTEND_URL}/dashboard/billing?status=cancelled",
        )

    except PaymentsNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except PaymentError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    return result


@router.post("/webhook")
async def webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        result = await handle_webhook_event(db, payload, sig_header)

    except PaymentsNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except PaymentError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return result
