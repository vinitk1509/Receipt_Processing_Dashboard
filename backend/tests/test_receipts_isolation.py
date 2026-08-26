import io
import uuid
import pytest


def test_receipt_creation_and_cross_user_isolation(client):
    suffix1 = uuid.uuid4().hex[:6]
    suffix2 = uuid.uuid4().hex[:6]

    # Register User 1
    u1_res = client.post("/api/auth/register", json={
        "fullName": "User One",
        "email": f"user1.{suffix1}@example.com",
        "password": "Password123",
        "confirmPassword": "Password123"
    })
    assert u1_res.status_code == 201
    token1 = u1_res.json()["access_token"]

    # Register User 2
    u2_res = client.post("/api/auth/register", json={
        "fullName": "User Two",
        "email": f"user2.{suffix2}@example.com",
        "password": "Password123",
        "confirmPassword": "Password123"
    })
    assert u2_res.status_code == 201
    token2 = u2_res.json()["access_token"]

    # User 1 submits a receipt
    file_bytes = io.BytesIO(b"%PDF-1.4 dummy confidential receipt for user 1")
    submit_res = client.post(
        "/api/receipts",
        headers={"Authorization": f"Bearer {token1}"},
        data={
            "title": "User 1 Client Dinner",
            "amount": "3450.75",
            "receiptDate": "2026-08-25",
            "category": "Client Meetings & Dining",
            "notes": "Business dinner"
        },
        files={"file": ("dinner.pdf", file_bytes, "application/pdf")}
    )
    assert submit_res.status_code == 201
    receipt_data = submit_res.json()
    receipt_id = receipt_data["id"]
    assert receipt_data["status"] == "PENDING"
    assert receipt_data["amount"] == 3450.75

    # User 1 can view their receipt
    u1_view = client.get(f"/api/receipts/{receipt_id}", headers={"Authorization": f"Bearer {token1}"})
    assert u1_view.status_code == 200

    # User 1 can download their attached file
    u1_file = client.get(f"/api/receipts/{receipt_id}/file", headers={"Authorization": f"Bearer {token1}"})
    assert u1_file.status_code == 200

    # CRITICAL IDOR / ISOLATION TEST:
    # User 2 MUST NOT be able to view User 1's receipt
    u2_view = client.get(f"/api/receipts/{receipt_id}", headers={"Authorization": f"Bearer {token2}"})
    assert u2_view.status_code == 403

    # User 2 MUST NOT be able to download User 1's file
    u2_file = client.get(f"/api/receipts/{receipt_id}/file", headers={"Authorization": f"Bearer {token2}"})
    assert u2_file.status_code == 403
