from typing import Optional
from pydantic import EmailStr, Field, model_validator
from app.schemas.base import CamelModel
from app.schemas.user import UserResponse


class RegisterRequest(CamelModel):
    """
    Registration DTO.
    Matches frontend RegisterRequest { fullName, email, password, confirmPassword }
    """
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of user")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 chars)")
    confirm_password: Optional[str] = Field(None, description="Confirm password matching password")

    @model_validator(mode="after")
    def check_passwords_match(self) -> "RegisterRequest":
        if self.confirm_password is not None and self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class LoginRequest(CamelModel):
    """
    Login DTO.
    Matches frontend LoginRequest { email, password }
    """
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")


class AuthResponse(CamelModel):
    """
    Authentication success response.
    Matches frontend AuthResponse { access_token, user }
    """
    access_token: str = Field(..., serialization_alias="access_token")
    token_type: str = Field("bearer", serialization_alias="token_type")
    user: UserResponse
