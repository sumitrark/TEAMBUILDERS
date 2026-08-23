import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("app.sms")

MSG91_OTP_URL = "https://control.msg91.com/api/v5/otp"


async def send_sms_otp(mobile_number: str, otp: str) -> None:
    """
    Deliver an OTP by SMS. Dispatches to the configured provider;
    falls back to logging (never sending a real SMS) whenever MSG91
    isn't fully configured, so local/dev environments work with zero
    setup and never accidentally hit a paid API.

    The OTP itself is generated and verified by this app, not MSG91 -
    MSG91 is used purely as the delivery channel via its "bring your
    own OTP" endpoint, so expiry/attempt-limiting stays centralized
    in our own database.
    """
    if (
        settings.SMS_PROVIDER == "msg91"
        and settings.MSG91_AUTH_KEY
        and settings.MSG91_TEMPLATE_ID
    ):
        await _send_via_msg91(mobile_number, otp)
    else:
        _send_via_console(mobile_number, otp)


async def _send_via_msg91(mobile_number: str, otp: str) -> None:
    params = {
        "otp": otp,
        "mobile": mobile_number,
        "authkey": settings.MSG91_AUTH_KEY,
        "template_id": settings.MSG91_TEMPLATE_ID,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(MSG91_OTP_URL, params=params)

    if response.status_code >= 400:
        # Log the failure but never include the OTP itself in logs
        # once a real provider is in play.
        logger.error(
            "MSG91 OTP send failed: status=%s body=%s",
            response.status_code,
            response.text[:500],
        )
        raise RuntimeError("Failed to send OTP via SMS provider")


def _send_via_console(mobile_number: str, otp: str) -> None:
    # Development fallback only. This branch is automatically disabled
    # the moment SMS_PROVIDER=msg91 plus real MSG91 credentials are
    # set - see send_sms_otp() above. Never enable this path in
    # production.
    logger.info(
        "[DEV OTP - no SMS provider configured] mobile=%s otp=%s",
        mobile_number,
        otp,
    )
