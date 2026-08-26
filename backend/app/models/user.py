import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base
from app.models.enums import UserRole


def generate_user_id() -> str:
    return f"u-{uuid.uuid4().hex[:8]}"


class User(Base):
    """
    User ORM Entity.
    """
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_user_id, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x]), default=UserRole.USER, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    receipts = relationship("Receipt", back_populates="user", foreign_keys="Receipt.user_id", cascade="all, delete-orphan")
    reviewed_receipts = relationship("Receipt", back_populates="reviewed_by_user", foreign_keys="Receipt.reviewed_by_id")

    @property
    def initials(self) -> str:
        """Derive 2-letter uppercase initials from full_name."""
        parts = self.full_name.strip().split()
        if not parts:
            return "U"
        if len(parts) == 1:
            return parts[0][:2].upper()
        return f"{parts[0][0]}{parts[1][0]}".upper()

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
