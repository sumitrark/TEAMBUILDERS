from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)

from app.crud.user import (
    create_user,
    get_user_by_email,
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

def generate_tokens(
    user: User,
) -> dict:

    subject = str(user.id)

    return {
        "access_token": create_access_token(
            subject
        ),

        "refresh_token": create_refresh_token(
            subject
        ),

        "token_type": "bearer",
    }