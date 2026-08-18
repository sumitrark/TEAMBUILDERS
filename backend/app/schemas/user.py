from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
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

    college: str = Field(
        ...,
        min_length=2,
        max_length=255,
    )

    course: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    year: int = Field(
        ...,
        ge=1,
        le=6,
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


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

    college: str = Field(
        ...,
        min_length=2,
        max_length=255,
    )

    course: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    year: int = Field(
        ...,
        ge=1,
        le=6,
    )

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


class UserResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID

    full_name: str

    username: str | None = None

    email: EmailStr

    college: str

    course: str

    year: int

    role: str

    is_active: bool

    bio: str | None = None

    github_url: str | None = None

    linkedin_url: str | None = None

    portfolio_url: str | None = None

    # These can be NULL for newly registered users
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