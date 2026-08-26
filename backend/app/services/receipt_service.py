import os
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings, UPLOAD_DIR
from app.models.receipt import Receipt
from app.models.user import User
from app.models.enums import UserRole, ReceiptStatus, ReceiptCategory
from app.schemas.receipt import ReceiptResponse
from app.schemas.user import UserResponse

# Allowed upload MIME types and extensions
ALLOWED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png"}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


class ReceiptService:
    """
    Service layer for Receipt management and secure document storage.
    Equivalent to Spring Boot ReceiptService.
    """

    @staticmethod
    def _validate_and_save_file(file: UploadFile) -> tuple[str, str, str, int, str]:
        """
        Validates file type, size, and saves to disk securely.
        Returns: (original_file_name, stored_file_name, file_path, file_size, content_type)
        """
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A document file must be provided."
            )

        # Sanitize original file name
        orig_name = os.path.basename(file.filename)
        ext = Path(orig_name).suffix.lower()

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension '{ext}'. Only PDF, JPEG, and PNG files are allowed."
            )

        # Read file contents and check size
        contents = file.file.read()
        file_size = len(contents)

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        if file_size > settings.max_upload_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size ({file_size / (1024*1024):.1f} MB) exceeds the maximum limit of {settings.MAX_UPLOAD_SIZE_MB} MB."
            )

        # Generate unique, safe server-side filename
        safe_suffix = re.sub(r'[^a-zA-Z0-9_.-]', '_', orig_name)
        stored_name = f"{uuid.uuid4().hex}_{safe_suffix}"
        dest_path = (UPLOAD_DIR / stored_name).resolve()

        # Path traversal protection
        if not str(dest_path).startswith(str(UPLOAD_DIR.resolve())):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file path."
            )

        # Save to disk
        with open(dest_path, "wb") as f:
            f.write(contents)

        content_type = file.content_type or "application/octet-stream"
        return orig_name, stored_name, str(dest_path), file_size, content_type

    @staticmethod
    def create_receipt(
        db: Session,
        current_user: User,
        title: str,
        amount_val: float,
        receipt_date: str,
        category_val: str,
        notes: Optional[str],
        file: UploadFile
    ) -> Receipt:
        """
        Creates a new receipt record.
        - STRICT OWNERSHIP: user_id is taken directly from current_user.id
        - STRICT STATUS: status defaults to PENDING
        """
        if not title or not title.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required.")

        try:
            amount_decimal = Decimal(str(amount_val))
            if amount_decimal <= 0:
                raise ValueError()
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be a positive number greater than 0.")

        # Future date validation
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if receipt_date > today_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Receipt date cannot be in the future (today is {today_str})."
            )

        try:
            cat_enum = ReceiptCategory(category_val)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category '{category_val}'. Must be one of {[c.value for c in ReceiptCategory]}."
            )

        orig_name, stored_name, file_path, file_size, content_type = ReceiptService._validate_and_save_file(file)

        receipt = Receipt(
            user_id=current_user.id,
            title=title.strip(),
            amount=amount_decimal,
            receipt_date=receipt_date,
            category=cat_enum,
            notes=notes.strip() if notes else "",
            original_file_name=orig_name,
            stored_file_name=stored_name,
            file_path=file_path,
            file_size=file_size,
            content_type=content_type,
            status=ReceiptStatus.PENDING,
        )

        db.add(receipt)
        db.commit()
        db.refresh(receipt)

        # Real-time WebSocket notification to all active Admins
        try:
            from app.core.notifications import notification_manager
            notification_manager.broadcast_all_sync({
                "type": "RECEIPT_CREATED",
                "receiptId": receipt.id,
                "title": receipt.title,
                "amount": float(receipt.amount),
                "category": receipt.category.value,
                "user": {
                    "id": current_user.id,
                    "fullName": current_user.full_name,
                    "email": current_user.email,
                },
                "message": f"New receipt submitted by {current_user.full_name}: '{receipt.title}' (${float(receipt.amount):.2f} AUD)"
            })
        except Exception:
            pass

        return receipt

    @staticmethod
    def get_user_receipts(db: Session, user_id: str) -> List[Receipt]:
        """Fetch all receipts submitted by a specific user."""
        return (
            db.query(Receipt)
            .options(joinedload(Receipt.user), joinedload(Receipt.reviewed_by_user))
            .filter(Receipt.user_id == user_id)
            .order_by(Receipt.submitted_at.desc())
            .all()
        )

    @staticmethod
    def get_receipt_by_id(db: Session, receipt_id: str) -> Optional[Receipt]:
        """Fetch a single receipt with user and reviewer relationships joined."""
        return (
            db.query(Receipt)
            .options(joinedload(Receipt.user), joinedload(Receipt.reviewed_by_user))
            .filter(Receipt.id == receipt_id)
            .first()
        )

    @staticmethod
    def check_receipt_access(receipt: Receipt, user: User) -> None:
        """
        Enforces resource-level ownership:
        - ADMIN can access any receipt.
        - Regular USER can ONLY access their own receipts.
        - Raises 403 Forbidden otherwise.
        """
        if user.role == UserRole.ADMIN:
            return
        if receipt.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view or download this receipt."
            )

    @staticmethod
    def to_receipt_response(receipt: Receipt) -> ReceiptResponse:
        """Helper to convert ORM model to API response schema."""
        submitted_at = receipt.submitted_at
        if submitted_at and submitted_at.tzinfo is None:
            submitted_at = submitted_at.replace(tzinfo=timezone.utc)

        reviewed_at = receipt.reviewed_at
        if reviewed_at and reviewed_at.tzinfo is None:
            reviewed_at = reviewed_at.replace(tzinfo=timezone.utc)

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
            submitted_at=submitted_at,
            reviewed_at=reviewed_at,
            user=UserResponse.model_validate(receipt.user),
            reviewed_by=UserResponse.model_validate(receipt.reviewed_by_user) if receipt.reviewed_by_user else None,
        )


receipt_service = ReceiptService()
