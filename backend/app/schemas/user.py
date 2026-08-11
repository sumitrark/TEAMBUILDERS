from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    college: str = Field(..., min_length=2, max_length=255)
    course: str = Field(..., min_length=2, max_length=150)
    year: int = Field(..., ge=1, le=6)
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: EmailStr
    college: str
    course: str
    year: int
    role: str
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse