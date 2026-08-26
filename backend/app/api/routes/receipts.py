import os
from typing import List, Optional
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.receipt import ReceiptResponse
from app.services.receipt_service import receipt_service

router = APIRouter(prefix="/api/receipts", tags=["Receipts"])


@router.post(
    "",
    response_model=ReceiptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new receipt with document upload",
    description="Upload a receipt with title, amount, receipt date, category, optional notes, and attached document (PDF, PNG, JPG)."
)
def create_receipt(
    title: str = Form(..., description="Receipt title"),
    amount: float = Form(..., description="Monetary amount (> 0)"),
    receiptDate: str = Form(..., description="Receipt date in YYYY-MM-DD format"),
    category: str = Form(..., description="Receipt category"),
    notes: Optional[str] = Form("", description="Optional notes"),
    file: UploadFile = File(..., description="Attached document file"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Receipt creation endpoint with multipart upload.
    """
    receipt = receipt_service.create_receipt(
        db=db,
        current_user=current_user,
        title=title,
        amount_val=amount,
        receipt_date=receiptDate,
        category_val=category,
        notes=notes,
        file=file
    )
    return receipt_service.to_receipt_response(receipt)


@router.get(
    "/me",
    response_model=List[ReceiptResponse],
    status_code=status.HTTP_200_OK,
    summary="List all receipts submitted by the current user",
    description="Returns an array of all receipts belonging exclusively to the authenticated user."
)
def get_my_receipts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List user's own receipts.
    """
    receipts = receipt_service.get_user_receipts(db, current_user.id)
    return [receipt_service.to_receipt_response(r) for r in receipts]


@router.get(
    "/{receipt_id}",
    response_model=ReceiptResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single receipt details",
    description="Returns detailed receipt information. Enforces ownership authorization."
)
def get_receipt(
    receipt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get receipt by ID with ownership check.
    """
    receipt = receipt_service.get_receipt_by_id(db, receipt_id)
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receipt with ID '{receipt_id}' was not found."
        )

    # STRICT OWNERSHIP CHECK: Only the receipt owner or an admin can access this receipt
    receipt_service.check_receipt_access(receipt, current_user)
    return receipt_service.to_receipt_response(receipt)


@router.get(
    "/{receipt_id}/file",
    summary="Securely view or download attached receipt document",
    description="Streams the receipt document file. Enforces ownership authorization."
)
def get_receipt_file(
    receipt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Stream attached receipt document.
    """
    receipt = receipt_service.get_receipt_by_id(db, receipt_id)
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receipt with ID '{receipt_id}' was not found."
        )

    # STRICT OWNERSHIP CHECK
    receipt_service.check_receipt_access(receipt, current_user)

    if not os.path.exists(receipt.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The file for this receipt is not found on disk."
        )

    return FileResponse(
        path=receipt.file_path,
        filename=receipt.original_file_name,
        media_type=receipt.content_type
    )
