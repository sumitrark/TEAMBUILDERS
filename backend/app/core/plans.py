from app.core.config import settings

PLANS = {
    "free": {
        "name": "Free",
        "price_cents": 0,
        "currency": "usd",
        "interval": None,
        "stripe_price_id": None,
        "purchasable": False,
        "features": [
            "Create up to 1 active hackathon",
            "Limited AI Content Studio usage",
            "Limited AI evaluation usage",
        ],
    },
    "pro": {
        "name": "Organizer Pro",
        "price_cents": 4900,
        "currency": "usd",
        "interval": "month",
        # Set this to a real Stripe Price ID once you've created the
        # product/price in your Stripe dashboard. Until then, checkout
        # for this plan returns a clear "not available" error rather
        # than silently charging the wrong amount.
        "stripe_price_id": settings.STRIPE_PRICE_ID_PRO,
        "purchasable": True,
        "features": [
            "Unlimited hackathons",
            "Advanced analytics",
            "Higher AI usage limits",
            "Priority support",
        ],
    },
    "enterprise": {
        "name": "Enterprise",
        "price_cents": None,
        "currency": "usd",
        "interval": None,
        "stripe_price_id": None,
        # Enterprise is contact-sales, not self-service checkout.
        "purchasable": False,
        "features": [
            "Institutional branding",
            "Large participant limits",
            "Dedicated support",
            "Custom integrations",
        ],
    },
}
