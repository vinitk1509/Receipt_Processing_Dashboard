import io
import json
import uuid
import pytest
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import hash_password


def test_admin_workflow_and_rbac(client, db_session):
    suffix = uuid.uuid4().hex[:6]
    admin_email = f"admin.{suffix}@example.com"
    user_email = f"user.{suffix}@example.com"
    admin_password = "AdminPassword123"
    user_password = "Password123"

    # Create Admin in DB
    admin = User(
        full_name="Test Admin",
        email=admin_email,
        hashed_password=hash_password(admin_password),
        role=UserRole.ADMIN,
    )
    db_session.add(admin)
    db_session.commit()

    # User credentials via registration
    u_res = client.post("/api/auth/register", json={
        "fullName": "Regular User",
        "email": user_email,
        "password": user_password,
        "confirmPassword": user_password
    })
    assert u_res.status_code == 201
    user_token = u_res.json()["access_token"]
    user_id = u_res.json()["user"]["id"]

    # Admin credentials via login
    a_res = client.post("/api/auth/login", json={
        "email": admin_email,
        "password": admin_password
    })
    assert a_res.status_code == 200
    admin_token = a_res.json()["access_token"]

    # 1. Non-admin user blocked from admin APIs (403)
    user_on_admin = client.get("/api/admin/receipts", headers={"Authorization": f"Bearer {user_token}"})
    assert user_on_admin.status_code == 403

    # 2. User creates a receipt
    file_bytes = io.BytesIO(b"%PDF-1.4 dummy hotel invoice")
    submit = client.post(
        "/api/receipts",
        headers={"Authorization": f"Bearer {user_token}"},
        data={
            "title": "Hotel Bangalore",
            "amount": "8200.00",
            "receiptDate": "2026-08-20",
            "category": "Accommodation",
            "notes": "2 nights stay"
        },
        files={"file": ("hotel.pdf", file_bytes, "application/pdf")}
    )
    assert submit.status_code == 201
    receipt_id = submit.json()["id"]

    # 3. Non-admin user cannot approve receipt (403)
    user_approve = client.patch(
        f"/api/admin/receipts/{receipt_id}/approve",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"reviewComment": "I approve myself"}
    )
    assert user_approve.status_code == 403

    # 4. Admin query filters
    admin_list = client.get(
        "/api/admin/receipts",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"query": "Bangalore", "category": "Accommodation"}
    )
    assert admin_list.status_code == 200
    assert any(r["id"] == receipt_id for r in admin_list.json())

    # 5. Connect WebSocket client for user & test approve notification
    with client.websocket_connect(f"/ws/notifications/{user_id}") as websocket:
        websocket.send_text("ping")
        resp = websocket.receive_text()
        assert resp == "pong"

        # Admin approves receipt
        admin_approve = client.patch(
            f"/api/admin/receipts/{receipt_id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"reviewComment": "Approved. Fits policy."}
        )
        assert admin_approve.status_code == 200
        assert admin_approve.json()["status"] == "APPROVED"
        assert admin_approve.json()["reviewedBy"]["email"] == admin_email

        # Receive WebSocket message
        ws_msg = websocket.receive_text()
        msg_json = json.loads(ws_msg)
        assert msg_json["type"] == "RECEIPT_STATUS_UPDATED"
        assert msg_json["status"] == "APPROVED"
        assert msg_json["receiptId"] == receipt_id

    # 6. Cannot review already reviewed receipt (409 Conflict)
    double_review = client.patch(
        f"/api/admin/receipts/{receipt_id}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={}
    )
    assert double_review.status_code == 409
