from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.current_user import get_current_user

from app.db.database import get_db
from app.schemas.otp import OtpStatusResponse, SendOtpRequest, VerifyOtpRequest
from app.schemas.user import (
    LoginResponse,
    LogoutRequest,
    RefreshRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import (
    authenticate_user,
    generate_tokens,
    logout,
    logout_all,
    refresh_access_token,
    register_user,
)
from app.services.otp_service import request_otp, verify_otp

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

    tokens = await generate_tokens(db, user)

    return {
        "user": user,
        "tokens": TokenResponse(**tokens),
    }


@router.post(
    "/refresh",
    response_model=TokenResponse,
)
async def refresh(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        tokens = await refresh_access_token(
            db,
            payload.refresh_token,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    return TokenResponse(**tokens)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout_route(
    payload: LogoutRequest,
    db: AsyncSession = Depends(get_db),
):
    await logout(db, payload.refresh_token)


@router.post(
    "/logout-all",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout_all_route(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await logout_all(db, current_user.id)


@router.post(
    "/otp/send",
    response_model=OtpStatusResponse,
)
async def send_otp(
    payload: SendOtpRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await request_otp(
            db,
            current_user,
            payload.mobile_number,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        ) from exc

    return OtpStatusResponse(**result)


@router.post("/otp/verify")
async def verify_otp_route(
    payload: VerifyOtpRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await verify_otp(
            db,
            current_user,
            payload.otp,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return result