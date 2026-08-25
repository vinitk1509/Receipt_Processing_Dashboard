import random
import string
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Integer, Text, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.enums import ReceiptStatus, ReceiptCategory


def generate_receipt_id() -> str:
    year = datetime.now(timezone.utc).year
    suffix = "".join(random.choices(string.digits, k=5))
    return f"REC-{year}-{suffix}"


class Receipt(Base):
    """
    Receipt ORM Entity.
    Equivalent to Spring Boot JPA @Entity @Table(name = "receipts")
    """
    __tablename__ = "receipts"

    id = Column(String(32), primary_key=True, default=generate_receipt_id, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    receipt_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    category = Column(SQLEnum(ReceiptCategory), nullable=False)
    notes = Column(Text, nullable=True, default="")

    original_file_name = Column(String(255), nullable=False)
    stored_file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True, default=0)
    content_type = Column(String(100), nullable=False)

    status = Column(SQLEnum(ReceiptStatus), default=ReceiptStatus.PENDING, nullable=False, index=True)
    review_comment = Column(Text, nullable=True)

    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="receipts")
    reviewed_by_user = relationship("User", foreign_keys=[reviewed_by_id], back_populates="reviewed_receipts")

    def __repr__(self) -> str:
        return f"<Receipt id={self.id} title={self.title} status={self.status}>"
