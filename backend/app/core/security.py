import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(
    subject: str,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": subject,
        "type": "access",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def _refresh_secret() -> str:
    return settings.JWT_REFRESH_SECRET or settings.SECRET_KEY


def create_refresh_token(
    subject: str,
) -> tuple[str, datetime]:
    """
    Returns (token, expires_at). The expiry is handed back so the caller
    can persist the exact same value in the refresh_tokens table instead
    of recomputing it and risking drift from what's actually in the JWT.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    payload = {
        "sub": subject,
        "type": "refresh",
        # Unique per issuance so two refresh tokens for the same user
        # never hash-collide even if minted in the same second.
        "jti": uuid.uuid4().hex,
        "exp": expire,
    }

    token = jwt.encode(
        payload,
        _refresh_secret(),
        algorithm=settings.ALGORITHM,
    )

    return token, expire


def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )


def decode_refresh_token(token: str) -> dict:
    payload = jwt.decode(
        token,
        _refresh_secret(),
        algorithms=[settings.ALGORITHM],
    )

    if payload.get("type") != "refresh":
        raise JWTError("Not a refresh token")

    return payload


def hash_token(token: str) -> str:
    """SHA-256 hex digest used as the DB lookup key for refresh tokens."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()