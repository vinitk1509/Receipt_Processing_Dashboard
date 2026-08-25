from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token


class AuthService:
    """
    Service layer for Authentication and User management.
    Equivalent to Spring Boot's AuthService / UserService.
    """

    @staticmethod
    def register_user(db: Session, req: RegisterRequest) -> tuple[User, str]:
        """
        Registers a new user.
        - Enforces unique email check (409 Conflict)
        - Normalizes email to lowercase
        - Hashes password with Argon2
        - STRICT SECURITY: Public registration ALWAYS assigns UserRole.USER
        - Generates and returns JWT token
        """
        normalized_email = req.email.strip().lower()

        # Check for existing email
        existing_user = db.query(User).filter(User.email == normalized_email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )

        # Hash password
        hashed_pwd = hash_password(req.password)

        # Always enforce USER role for public registration
        new_user = User(
            full_name=req.full_name.strip(),
            email=normalized_email,
            hashed_password=hashed_pwd,
            role=UserRole.USER,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Generate JWT token
        token = create_access_token(subject=new_user.id, role=new_user.role.value)
        return new_user, token

    @staticmethod
    def authenticate_user(db: Session, req: LoginRequest) -> tuple[User, str]:
        """
        Authenticates a user with email and password.
        - Validates credentials against Argon2 hash
        - Generates JWT token upon success
        - Raises 401 Unauthorized for invalid credentials without revealing whether email exists
        """
        normalized_email = req.email.strip().lower()

        user = db.query(User).filter(User.email == normalized_email).first()
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = create_access_token(subject=user.id, role=user.role.value)
        return user, token

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> User | None:
        """Fetch user by ID."""
        return db.query(User).filter(User.id == user_id).first()


auth_service = AuthService()
