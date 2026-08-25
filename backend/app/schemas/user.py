from app.models.enums import UserRole
from app.schemas.base import CamelModel


class UserResponse(CamelModel):
    """
    Safe User DTO returned by API endpoints.
    Matches frontend interface User { id, fullName, email, role, initials }
    """
    id: str
    full_name: str
    email: str
    role: UserRole
    initials: str
