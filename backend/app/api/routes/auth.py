from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.current_user import get_current_user

from app.db.database import get_db
from app.schemas.user import (
    LoginResponse,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import (
    authenticate_user,
    generate_tokens,
    register_user,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.get(
    "/me",
    response_model=UserResponse,
)
async def me(
    current_user=Depends(get_current_user),
):
    return current_user


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await register_user(db, payload)
        return user

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/login",
    response_model=LoginResponse,
)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await authenticate_user(db, payload)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    tokens = generate_tokens(user)

    return {
        "user": user,
        "tokens": TokenResponse(**tokens),
    }