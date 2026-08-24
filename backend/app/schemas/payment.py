from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CheckoutRequest(BaseModel):

    plan_code: str


class CheckoutResponse(BaseModel):

    checkout_url: str

    session_id: str


class PlanResponse(BaseModel):

    code: str
    name: str
    price_cents: int | None
    currency: str
    interval: str | None
    purchasable: bool
    features: list[str]


class SubscriptionResponse(BaseModel):

    plan: str
    status: str | None


class PaymentTransactionResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan_code: str
    amount_cents: int | None
    currency: str
    status: str
    created_at: datetime
    updated_at: datetime
