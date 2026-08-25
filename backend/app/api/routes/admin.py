from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_admin
from app.models.user import User
from app.schemas.receipt import ReceiptResponse, ReceiptReviewRequest
from app.services.admin_service import admin_service
from app.services.export_service import export_service

router = APIRouter(prefix="/api/admin/receipts", tags=["Admin"])


@router.get(
    "",
    response_model=List[ReceiptResponse],
    status_code=status.HTTP_200_OK,
    summary="Admin query all receipts with optional filters",
    description="Fetch all receipts with search across text/user, status filtering, category filtering, and date range filtering."
)
def list_receipts(
    query: Optional[str] = Query(None, description="Search term across title, ID, user name, email"),
    userId: Optional[str] = Query(None, description="Filter by submitting user ID"),
    status: Optional[str] = Query(None, description="Filter by receipt status (PENDING, APPROVED, REJECTED, ALL)"),
    category: Optional[str] = Query(None, description="Filter by receipt category"),
    fromDate: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    toDate: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin receipt query with multi-criteria filtering.
    Equivalent to Spring Boot @GetMapping("/api/admin/receipts") with @PreAuthorize("hasRole('ADMIN')")
    """
    receipts = admin_service.list_all_receipts(
        db=db,
        search_query=query,
        user_id=userId,
        status_filter=status,
        category_filter=category,
        from_date=fromDate,
        to_date=toDate
    )
    return [admin_service.to_receipt_response(r) for r in receipts]


@router.get(
    "/export/csv",
    summary="Export approved receipts as CSV",
    description="Generates and streams a downloadable CSV file containing only APPROVED receipts."
)
def export_approved_csv(
    userId: Optional[str] = Query(None, description="Filter by user ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    fromDate: Optional[str] = Query(None, description="Filter from receipt date"),
    toDate: Optional[str] = Query(None, description="Filter to receipt date"),
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Export approved receipts to CSV.
    Equivalent to Spring Boot CsvExportController.
    """
    csv_buffer = export_service.generate_csv(
        db=db,
        user_id=userId,
        category=category,
        from_date=fromDate,
        to_date=toDate
    )
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    filename = f"approved_receipts_{today_str}.csv"

    return Response(
        content=csv_buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get(
    "/export/excel",
    summary="Export approved receipts as Excel (.xlsx)",
    description="Generates and streams a styled downloadable Excel file containing only APPROVED receipts."
)
def export_approved_excel(
    userId: Optional[str] = Query(None, description="Filter by user ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    fromDate: Optional[str] = Query(None, description="Filter from receipt date"),
    toDate: Optional[str] = Query(None, description="Filter to receipt date"),
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Export approved receipts to Excel.
    Equivalent to Spring Boot ExcelExportController.
    """
    excel_buffer = export_service.generate_excel(
        db=db,
        user_id=userId,
        category=category,
        from_date=fromDate,
        to_date=toDate
    )
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    filename = f"approved_receipts_{today_str}.xlsx"

    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get(
    "/{receipt_id}",
    response_model=ReceiptResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin get receipt details",
    description="Fetches full details for a receipt for admin review."
)
def get_receipt(
    receipt_id: str,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin get receipt by ID.
    Equivalent to Spring Boot @GetMapping("/api/admin/receipts/{receipt_id}")
    """
    receipt = admin_service.get_receipt_by_id(db, receipt_id)
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receipt with ID '{receipt_id}' was not found."
        )
    return admin_service.to_receipt_response(receipt)


@router.patch(
    "/{receipt_id}/approve",
    response_model=ReceiptResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve a pending receipt",
    description="Sets receipt status to APPROVED. Only allowed for PENDING receipts."
)
def approve_receipt(
    receipt_id: str,
    payload: Optional[ReceiptReviewRequest] = None,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Approve receipt.
    Equivalent to Spring Boot @PatchMapping("/api/admin/receipts/{receipt_id}/approve")
    """
    comment = payload.review_comment if payload else None
    receipt = admin_service.approve_receipt(
        db=db,
        admin_user=admin_user,
        receipt_id=receipt_id,
        review_comment=comment
    )
    return admin_service.to_receipt_response(receipt)


@router.patch(
    "/{receipt_id}/reject",
    response_model=ReceiptResponse,
    status_code=status.HTTP_200_OK,
    summary="Reject a pending receipt",
    description="Sets receipt status to REJECTED. Requires reviewComment. Only allowed for PENDING receipts."
)
def reject_receipt(
    receipt_id: str,
    payload: ReceiptReviewRequest,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Reject receipt.
    Equivalent to Spring Boot @PatchMapping("/api/admin/receipts/{receipt_id}/reject")
    """
    receipt = admin_service.reject_receipt(
        db=db,
        admin_user=admin_user,
        receipt_id=receipt_id,
        review_comment=payload.review_comment
    )
    return admin_service.to_receipt_response(receipt)
