from datetime import datetime, timezone
from uuid import UUID

from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)

from app.crud.user import (
    create_user,
    get_user_by_email,
    get_user_by_id,
)
from app.crud.refresh_token import (
    create_refresh_token_record,
    get_refresh_token_by_hash,
    revoke_all_refresh_tokens_for_user,
    revoke_refresh_token,
)

from app.models.user import User
from app.schemas.user import (
    UserLogin,
    UserRegister,
)


# =========================================================
# REGISTER USER
# =========================================================

async def register_user(
    db: AsyncSession,
    payload: UserRegister,
) -> User:

    # -----------------------------------------------------
    # CHECK EMAIL
    # -----------------------------------------------------

    existing_user = await get_user_by_email(
        db,
        payload.email,
    )

    if existing_user:
        raise ValueError(
            "Email already registered"
        )

    # -----------------------------------------------------
    # VALIDATE ROLE
    # -----------------------------------------------------

    if payload.role not in {
        "student",
        "organizer",
    }:
        raise ValueError(
            "Invalid registration role"
        )

    # -----------------------------------------------------
    # STUDENT VALIDATION
    # -----------------------------------------------------

    if payload.role == "student":

        if not payload.college:
            raise ValueError(
                "College is required for participants"
            )

        if not payload.course:
            raise ValueError(
                "Course is required for participants"
            )

        if payload.year is None:
            raise ValueError(
                "Year is required for participants"
            )

    # -----------------------------------------------------
    # ORGANIZER VALIDATION
    # -----------------------------------------------------

    if payload.role == "organizer":

        if not payload.organization:
            raise ValueError(
                "Organization or institution is required"
            )

        if not payload.designation:
            raise ValueError(
                "Designation is required for organizers"
            )

    # -----------------------------------------------------
    # GENERATE USERNAME
    # -----------------------------------------------------

    username = payload.email.split("@", 1)[0]

    # Prevent username collision
    existing_username = await get_user_by_email(
        db,
        payload.email,
    )

    if existing_username:
        raise ValueError(
            "User already exists"
        )

    # -----------------------------------------------------
    # CREATE USER
    # -----------------------------------------------------

    user = User(
        full_name=payload.full_name,

        username=username,

        email=payload.email,

        hashed_password=hash_password(
            payload.password
        ),

        role=payload.role,

        is_active=True,

        # Student information
        college=payload.college,
        course=payload.course,
        year=payload.year,

        # Organizer information
        organization=payload.organization,
        designation=payload.designation,

        # Profile
        bio=payload.bio,

        linkedin_url=payload.linkedin_url,

        portfolio_url=payload.portfolio_url,
    )

    return await create_user(
        db,
        user,
    )


# =========================================================
# LOGIN
# =========================================================

async def authenticate_user(
    db: AsyncSession,
    payload: UserLogin,
) -> User:

    user = await get_user_by_email(
        db,
        payload.email,
    )

    if not user:
        raise ValueError(
            "Invalid email or password"
        )

    if not verify_password(
        payload.password,
        user.hashed_password,
    ):
        raise ValueError(
            "Invalid email or password"
        )

    if not user.is_active:
        raise ValueError(
            "User account is inactive"
        )

    return user


# =========================================================
# GENERATE TOKENS
# =========================================================

async def generate_tokens(
    db: AsyncSession,
    user: User,
) -> dict:

    subject = str(user.id)

    access_token = create_access_token(subject)
    refresh_token, refresh_expires_at = create_refresh_token(subject)

    await create_refresh_token_record(
        db,
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=refresh_expires_at,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# =========================================================
# REFRESH ACCESS TOKEN (ROTATION)
# =========================================================

async def refresh_access_token(
    db: AsyncSession,
    refresh_token: str,
) -> dict:

    try:
        payload = decode_refresh_token(refresh_token)

    except JWTError as exc:
        raise ValueError(
            "Invalid or expired refresh token"
        ) from exc

    subject = payload.get("sub")

    if not subject:
        raise ValueError("Invalid refresh token")

    token_hash = hash_token(refresh_token)

    record = await get_refresh_token_by_hash(db, token_hash)

    if not record:
        raise ValueError("Refresh token not recognized")

    if record.revoked_at is not None:
        # This exact token was already rotated away (or logged out)
        # once before, and is being presented again. That only
        # happens if it was stolen and copied - a legitimate client
        # always moves on to the newest token after rotation. Treat
        # this as a compromise signal and kill every active session
        # for the user, not just this one token.
        await revoke_all_refresh_tokens_for_user(db, record.user_id)

        raise ValueError(
            "Refresh token has already been used. "
            "All sessions have been signed out for safety."
        )

    expires_at = record.expires_at

    if expires_at.tzinfo is None:
        # Defensive: some DB backends/drivers can return naive datetimes
        # even from a timezone-aware column. Every value we ever write
        # to this column is UTC, so treat naive as UTC rather than risk
        # a crash or a wrong-timezone comparison.
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise ValueError("Refresh token has expired")

    user = await get_user_by_id(db, record.user_id)

    if not user or not user.is_active:
        raise ValueError("User not found or inactive")

    new_access_token = create_access_token(subject)
    new_refresh_token, new_expires_at = create_refresh_token(subject)
    new_token_hash = hash_token(new_refresh_token)

    await create_refresh_token_record(
        db,
        user_id=user.id,
        token_hash=new_token_hash,
        expires_at=new_expires_at,
    )

    await revoke_refresh_token(
        db,
        record,
        replaced_by_token_hash=new_token_hash,
    )

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


# =========================================================
# LOGOUT
# =========================================================

async def logout(
    db: AsyncSession,
    refresh_token: str,
) -> None:

    token_hash = hash_token(refresh_token)

    record = await get_refresh_token_by_hash(db, token_hash)

    if record and record.revoked_at is None:
        await revoke_refresh_token(db, record)


async def logout_all(
    db: AsyncSession,
    user_id: UUID,
) -> None:

    await revoke_all_refresh_tokens_for_user(db, user_id)