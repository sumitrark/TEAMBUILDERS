import re

from pydantic import BaseModel, Field, field_validator

MOBILE_NUMBER_PATTERN = re.compile(r"^\+?[1-9]\d{7,14}$")


class SendOtpRequest(BaseModel):

    mobile_number: str = Field(
        ...,
        min_length=8,
        max_length=16,
    )

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile_number(cls, value: str) -> str:
        cleaned = value.strip().replace(" ", "")

        if not MOBILE_NUMBER_PATTERN.match(cleaned):
            raise ValueError(
                "Enter a valid mobile number in international format, "
                "e.g. +919876543210"
            )

        return cleaned


class VerifyOtpRequest(BaseModel):

    otp: str = Field(
        ...,
        min_length=4,
        max_length=8,
    )

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, value: str) -> str:
        cleaned = value.strip()

        if not cleaned.isdigit():
            raise ValueError("OTP must contain digits only")

        return cleaned


class OtpStatusResponse(BaseModel):

    message: str

    expires_in_seconds: int | None = None

    resend_available_in_seconds: int | None = None
