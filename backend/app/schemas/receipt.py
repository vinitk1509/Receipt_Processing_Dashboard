from datetime import datetime
from typing import Optional
from pydantic import Field, field_validator
from app.models.enums import ReceiptStatus, ReceiptCategory
from app.schemas.base import CamelModel
from app.schemas.user import UserResponse


class ReceiptResponse(CamelModel):
    """
    Receipt DTO returned to frontend.
    Matches frontend interface Receipt { id, title, amount, receiptDate, category, notes, ... }
    """
    id: str
    title: str
    amount: float
    receipt_date: str
    category: ReceiptCategory
    notes: Optional[str] = ""
    file_url: Optional[str] = None
    file_name: str
    file_size: Optional[int] = 0
    status: ReceiptStatus
    review_comment: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    user: UserResponse
    reviewed_by: Optional[UserResponse] = None

    @field_validator("file_name", mode="before")
    @classmethod
    def extract_file_name(cls, v: str, info) -> str:
        # If original_file_name was passed from ORM
        return v


class ReceiptReviewRequest(CamelModel):
    """
    Admin review request DTO.
    Matches frontend ReceiptReviewRequest { reviewComment }
    """
    review_comment: Optional[str] = Field(None, description="Optional or mandatory feedback comment")
