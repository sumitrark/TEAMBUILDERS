from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: str | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str