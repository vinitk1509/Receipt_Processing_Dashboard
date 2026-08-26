from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description="Registers a new user with USER role. Email uniqueness is verified."
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Public registration endpoint.
    """
    user, token = auth_service.register_user(db, payload)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="User and Admin login",
    description="Authenticates credentials and returns a signed JWT access token and user metadata."
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login endpoint for all roles.
    """
    user, token = auth_service.authenticate_user(db, payload)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Returns the profile information of the currently authenticated user."
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Current user endpoint.
    """
    return UserResponse.model_validate(current_user)
