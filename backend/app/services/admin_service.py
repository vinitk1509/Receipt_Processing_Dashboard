from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.models.receipt import Receipt
from app.models.user import User
from app.models.enums import ReceiptStatus, ReceiptCategory
from app.schemas.receipt import ReceiptResponse
from app.schemas.user import UserResponse


class AdminService:
    """
    Service layer for Administrator receipt review, searching, and filtering.
    Equivalent to Spring Boot AdminReceiptService.
    """

    @staticmethod
    def list_all_receipts(
        db: Session,
        search_query: Optional[str] = None,
        user_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[Receipt]:
        """
        Queries all receipts with optional filtering and eager loaded relationships.
        """
        query = (
            db.query(Receipt)
            .join(Receipt.user)
            .options(joinedload(Receipt.user), joinedload(Receipt.reviewed_by_user))
        )

        # Search across title, receipt ID, user's full name, and email
        if search_query and search_query.strip():
            term = f"%{search_query.strip()}%"
            query = query.filter(
                or_(
                    Receipt.title.ilike(term),
                    Receipt.id.ilike(term),
                    User.full_name.ilike(term),
                    User.email.ilike(term),
                )
            )

        # Filter by User ID
        if user_id and user_id.strip() and user_id.strip().upper() != "ALL":
            query = query.filter(Receipt.user_id == user_id.strip())

        # Filter by Status
        if status_filter and status_filter.strip() and status_filter.strip().upper() != "ALL":
            try:
                st = ReceiptStatus(status_filter.strip().upper())
                query = query.filter(Receipt.status == st)
            except ValueError:
                pass

        # Filter by Category
        if category_filter and category_filter.strip() and category_filter.strip().upper() != "ALL":
            try:
                cat = ReceiptCategory(category_filter.strip())
                query = query.filter(Receipt.category == cat)
            except ValueError:
                pass

        # Filter by Date range (YYYY-MM-DD)
        if from_date and from_date.strip():
            query = query.filter(Receipt.receipt_date >= from_date.strip())
        if to_date and to_date.strip():
            query = query.filter(Receipt.receipt_date <= to_date.strip())

        return query.order_by(Receipt.submitted_at.desc()).all()

    @staticmethod
    def get_receipt_by_id(db: Session, receipt_id: str) -> Optional[Receipt]:
        """Get single receipt with user and reviewer eager loaded."""
        return (
            db.query(Receipt)
            .options(joinedload(Receipt.user), joinedload(Receipt.reviewed_by_user))
            .filter(Receipt.id == receipt_id)
            .first()
        )

    @staticmethod
    def approve_receipt(
        db: Session,
        admin_user: User,
        receipt_id: str,
        review_comment: Optional[str] = None
    ) -> Receipt:
        """
        Approves a PENDING receipt.
        - Enforces state check: Only PENDING receipts can be reviewed.
        - Sets status to APPROVED, records reviewed_at and reviewed_by_id.
        """
        receipt = AdminService.get_receipt_by_id(db, receipt_id)
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receipt with ID '{receipt_id}' was not found."
            )

        if receipt.status != ReceiptStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Receipt '{receipt_id}' has already been reviewed and is marked as {receipt.status.value}."
            )

        receipt.status = ReceiptStatus.APPROVED
        receipt.review_comment = review_comment.strip() if review_comment else None
        receipt.reviewed_at = datetime.now(timezone.utc)
        receipt.reviewed_by_id = admin_user.id

        db.commit()
        db.refresh(receipt)
        return receipt

    @staticmethod
    def reject_receipt(
        db: Session,
        admin_user: User,
        receipt_id: str,
        review_comment: Optional[str]
    ) -> Receipt:
        """
        Rejects a PENDING receipt.
        - Requires non-empty review_comment.
        - Enforces state check: Only PENDING receipts can be reviewed.
        - Sets status to REJECTED, records reviewed_at and reviewed_by_id.
        """
        if not review_comment or not review_comment.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A review comment is required when rejecting a receipt."
            )

        receipt = AdminService.get_receipt_by_id(db, receipt_id)
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receipt with ID '{receipt_id}' was not found."
            )

        if receipt.status != ReceiptStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Receipt '{receipt_id}' has already been reviewed and is marked as {receipt.status.value}."
            )

        receipt.status = ReceiptStatus.REJECTED
        receipt.review_comment = review_comment.strip()
        receipt.reviewed_at = datetime.now(timezone.utc)
        receipt.reviewed_by_id = admin_user.id

        db.commit()
        db.refresh(receipt)
        return receipt

    @staticmethod
    def to_receipt_response(receipt: Receipt) -> ReceiptResponse:
        """Helper to convert ORM model to API response schema."""
        return ReceiptResponse(
            id=receipt.id,
            title=receipt.title,
            amount=float(receipt.amount),
            receipt_date=receipt.receipt_date,
            category=receipt.category,
            notes=receipt.notes or "",
            file_url=f"/api/receipts/{receipt.id}/file",
            file_name=receipt.original_file_name,
            file_size=receipt.file_size or 0,
            status=receipt.status,
            review_comment=receipt.review_comment,
            submitted_at=receipt.submitted_at,
            reviewed_at=receipt.reviewed_at,
            user=UserResponse.model_validate(receipt.user),
            reviewed_by=UserResponse.model_validate(receipt.reviewed_by_user) if receipt.reviewed_by_user else None,
        )


admin_service = AdminService()
