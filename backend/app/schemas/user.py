from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    model_validator,
)


# =========================================================
# AUTHENTICATION
# =========================================================


class UserRegister(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )

    # Allowed:
    # student
    # organizer
    # judge (only with a valid invitation_token)
    role: str = Field(
        default="student",
    )

    # Required when role == "judge" - links registration to a
    # specific pending JudgeInvitation.
    invitation_token: str | None = None

    # -----------------------------------------------------
    # PARTICIPANT INFORMATION
    # -----------------------------------------------------

    college: str | None = Field(
        default=None,
        min_length=2,
        max_length=255,
    )

    course: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    year: int | None = Field(
        default=None,
        ge=1,
        le=6,
    )

    # -----------------------------------------------------
    # ORGANIZER INFORMATION
    # -----------------------------------------------------

    organization: str | None = Field(
        default=None,
        min_length=2,
        max_length=255,
    )

    designation: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    bio: str | None = Field(
        default=None,
        max_length=1000,
    )

    linkedin_url: str | None = Field(
        default=None,
        max_length=500,
    )

    portfolio_url: str | None = Field(
        default=None,
        max_length=500,
    )

    # -----------------------------------------------------
    # VALIDATE REGISTRATION
    # -----------------------------------------------------

    @model_validator(mode="after")
    def validate_registration(self):

        allowed_roles = {
            "student",
            "organizer",
            "judge",
        }

        if self.role not in allowed_roles:
            raise ValueError(
                "Registration is allowed only for "
                "student, organizer, or an invited judge"
            )

        # -------------------------------------------------
        # STUDENT VALIDATION
        # -------------------------------------------------

        if self.role == "student":

            if not self.college:
                raise ValueError(
                    "College is required for participants"
                )

            if not self.course:
                raise ValueError(
                    "Course is required for participants"
                )

            if self.year is None:
                raise ValueError(
                    "Year is required for participants"
                )

        # -------------------------------------------------
        # ORGANIZER VALIDATION
        # -------------------------------------------------

        if self.role == "organizer":

            if not self.organization:
                raise ValueError(
                    "Organization or institution is required"
                )

            if not self.designation:
                raise ValueError(
                    "Designation is required for organizers"
                )

        # -------------------------------------------------
        # JUDGE VALIDATION
        #
        # Judge registration is never publicly open on its own -
        # it requires a token from a specific JudgeInvitation.
        # The token/email/expiry itself is verified against the
        # database in auth_service.register_user(), since a
        # Pydantic schema has no DB access; this only enforces
        # that a token was supplied at all.
        # -------------------------------------------------

        if self.role == "judge":

            if not self.invitation_token:
                raise ValueError(
                    "Judge registration requires a valid invitation link"
                )

        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# =========================================================
# PROFILE
# =========================================================


class UserProfileUpdate(BaseModel):

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    username: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    # -----------------------------------------------------
    # PARTICIPANT INFORMATION
    # -----------------------------------------------------

    college: str | None = Field(
        default=None,
        max_length=255,
    )

    course: str | None = Field(
        default=None,
        max_length=150,
    )

    year: int | None = Field(
        default=None,
        ge=1,
        le=6,
    )

    # -----------------------------------------------------
    # ORGANIZER INFORMATION
    # -----------------------------------------------------

    organization: str | None = Field(
        default=None,
        max_length=255,
    )

    designation: str | None = Field(
        default=None,
        max_length=150,
    )

    # -----------------------------------------------------
    # GENERAL PROFILE
    # -----------------------------------------------------

    bio: str | None = Field(
        default=None,
        max_length=1000,
    )

    github_url: str | None = Field(
        default=None,
        max_length=500,
    )

    linkedin_url: str | None = Field(
        default=None,
        max_length=500,
    )

    portfolio_url: str | None = Field(
        default=None,
        max_length=500,
    )

    skills: list[str] = Field(
        default_factory=list,
    )

    preferred_roles: list[str] = Field(
        default_factory=list,
    )


# =========================================================
# USER RESPONSE
# =========================================================


class UserResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID

    full_name: str

    username: str | None = None

    email: EmailStr

    # Participant fields
    college: str | None = None

    course: str | None = None

    year: int | None = None

    # Organizer fields
    organization: str | None = None

    designation: str | None = None

    # Role
    role: str

    is_active: bool

    # Phone verification
    mobile_number: str | None = None

    phone_verified: bool = False

    # Profile
    bio: str | None = None

    github_url: str | None = None

    linkedin_url: str | None = None

    portfolio_url: str | None = None

    # AI matchmaking
    skills: list[str] | None = None

    preferred_roles: list[str] | None = None


# =========================================================
# AUTH RESPONSES
# =========================================================


class TokenResponse(BaseModel):

    access_token: str

    refresh_token: str

    token_type: str = "bearer"


class LoginResponse(BaseModel):

    user: UserResponse

    tokens: TokenResponse


class RefreshRequest(BaseModel):

    refresh_token: str


class LogoutRequest(BaseModel):

    refresh_token: str