from datetime import datetime, timezone, timedelta
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.identity_verification import IdentityVerification
from app.models.participant import Participant


class MockIdentityProvider:
    name = "mock"

    async def start_verification(self, participant_id: UUID) -> dict:
        return {
            "provider": self.name,
            "provider_reference": f"MOCK-{uuid4().hex[:12].upper()}",
            "status": "VERIFIED",
            "verified_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=365),
        }


async def get_or_create_verification(
    db: AsyncSession,
    participant: Participant,
) -> IdentityVerification:
    result = await db.execute(
        select(IdentityVerification).where(
            IdentityVerification.participant_id == participant.id
        )
    )
    verification = result.scalar_one_or_none()

    if verification:
        return verification

    verification = IdentityVerification(
        participant_id=participant.id,
        provider="mock",
        status="PENDING",
    )
    db.add(verification)
    await db.commit()
    await db.refresh(verification)
    return verification


async def verify_identity(
    db: AsyncSession,
    participant: Participant,
) -> IdentityVerification:
    verification = await get_or_create_verification(db, participant)

    provider = MockIdentityProvider()
    result = await provider.start_verification(participant.id)

    verification.provider = result["provider"]
    verification.provider_reference = result["provider_reference"]
    verification.status = result["status"]
    verification.verified_at = result["verified_at"]
    verification.expires_at = result["expires_at"]
    verification.provider_metadata = {
        "environment": "development",
        "method": "mock",
    }
    verification.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(verification)

    return verification

