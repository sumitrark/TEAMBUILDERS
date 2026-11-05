
from html import escape

import httpx

from app.core.config import settings


async def send_judge_invitation_email(
    email: str,
    hackathon_title: str,
    invitation_url: str,
    expires_at,
) -> bool:
    if (
        settings.EMAIL_PROVIDER != "resend"
        or not settings.RESEND_API_KEY
    ):
        return False

    safe_title = escape(hackathon_title)
    safe_url = escape(invitation_url, quote=True)
    safe_expiry = escape(str(expires_at))

    payload = {
        "from": settings.EMAIL_FROM,
        "to": [email],
        "subject": f"Invitation to judge {hackathon_title}",
        "html": f"""
        <div style="font-family:Arial,sans-serif;max-width:600px">
          <h2>You're invited to judge!</h2>
          <p>
            You have been invited to evaluate projects in
            <strong>{safe_title}</strong>.
          </p>
          <p>Open the invitation below to accept or decline.</p>
          <a href="{safe_url}"
             style="display:inline-block;padding:12px 20px;
             background:#6d28d9;color:white;text-decoration:none;
             border-radius:8px">
             Open Judge Invitation
          </a>
          <p>This invitation expires at {safe_expiry}.</p>
        </div>
        """,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

        response.raise_for_status()

    return True

