import io
import os
import sqlite3
import json
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings, UPLOAD_DIR
from app.scripts.create_admin import create_or_upgrade_admin

print("===============================================================")
print("   COMPREHENSIVE END-TO-END SYSTEM & SECURITY AUDIT")
print("===============================================================")

client = TestClient(app)

# -------------------------------------------------------------
# 1. DATABASE AUDIT: Check DB file and tables
# -------------------------------------------------------------
db_file = settings.DATABASE_URL.replace("sqlite:///", "")
print(f"\n[1] Database Location: {db_file}")
conn = sqlite3.connect(db_file)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cursor.fetchall()]
print(f"    Existing Tables: {tables}")
assert "users" in tables and "receipts" in tables, "Tables missing!"

# -------------------------------------------------------------
# 2. ADMIN PROVISIONING AUDIT
# -------------------------------------------------------------
print("\n[2] Provisioning Admin User via CLI script...")
create_or_upgrade_admin("admin@clearclaim.internal", "SuperAdminSecret123!", "System Administrator")

cursor.execute("SELECT id, full_name, email, hashed_password, role FROM users WHERE email = ?", ("admin@clearclaim.internal",))
admin_row = cursor.fetchone()
print(f"    Admin User in DB: ID={admin_row[0]} | Name={admin_row[1]} | Role={admin_row[4]}")
print(f"    Password Hash Prefix: {admin_row[3][:30]}... (Argon2 verified)")
assert admin_row[3].startswith("$argon2"), "Password not hashed with Argon2!"
assert admin_row[4] == "ADMIN", "Admin role mismatch!"

# -------------------------------------------------------------
# 3. REGISTRATION & PRIVILEGE ESCALATION PREVENTION
# -------------------------------------------------------------
print("\n[3] Testing Public Registration & Privilege Escalation Defense...")
# Attacker attempts to register with role = ADMIN
reg_res = client.post("/api/auth/register", json={
    "fullName": "Alice Wonderland",
    "email": "alice.audit@example.com",
    "password": "AlicePassword123!",
    "confirmPassword": "AlicePassword123!",
    "role": "ADMIN"  # Malicious payload injection attempt
})
print("    Registration Status Code:", reg_res.status_code)
assert reg_res.status_code in [201, 409]

if reg_res.status_code == 201:
    alice_data = reg_res.json()
    alice_token = alice_data["access_token"]
    alice_id = alice_data["user"]["id"]
    print("    Assigned Role in API Response:", alice_data["user"]["role"])
    assert alice_data["user"]["role"] == "USER", "Security Vulnerability: Attacker was able to set ADMIN role!"
else:
    # Already registered in DB from previous run, login instead
    log_a = client.post("/api/auth/login", json={"email": "alice.audit@example.com", "password": "AlicePassword123!"})
    alice_token = log_a.json()["access_token"]
    alice_id = log_a.json()["user"]["id"]

# Check directly in SQLite DB
cursor.execute("SELECT id, email, hashed_password, role FROM users WHERE email = ?", ("alice.audit@example.com",))
alice_db = cursor.fetchone()
print(f"    Assigned Role in SQLite Table: {alice_db[3]}")
assert alice_db[3] == "USER", "DB role mismatch!"
assert alice_db[2].startswith("$argon2"), "Password not hashed with Argon2!"

# Duplicate registration check
dup_res = client.post("/api/auth/register", json={
    "fullName": "Alice Wonderland",
    "email": "alice.audit@example.com",
    "password": "AlicePassword123!",
    "confirmPassword": "AlicePassword123!"
})
print("    Duplicate Registration Status Code:", dup_res.status_code, "(Expected 409 Conflict)")
assert dup_res.status_code == 409

# -------------------------------------------------------------
# 4. LOGIN & JWT CLAIMS AUDIT
# -------------------------------------------------------------
print("\n[4] Testing Login & JWT Token Claims...")
login_res = client.post("/api/auth/login", json={
    "email": "alice.audit@example.com",
    "password": "AlicePassword123!"
})
assert login_res.status_code == 200
print("    Login Success: JWT issued, Token Type =", login_res.json()["token_type"])
assert "hashed_password" not in str(login_res.json()), "Security Vulnerability: Password hash leaked in JSON response!"

# -------------------------------------------------------------
# 5. FILE UPLOADS, VALIDATION & STORAGE LOCATION AUDIT
# -------------------------------------------------------------
print(f"\n[5] Testing File Upload & Storage in {UPLOAD_DIR}...")
sample_pdf = b"%PDF-1.4 Sample Tax Invoice Receipt for Bangalore Travel"
upload_res = client.post(
    "/api/receipts",
    headers={"Authorization": f"Bearer {alice_token}"},
    data={
        "title": "Bangalore Client Engagement Travel",
        "amount": "15890.50",
        "receiptDate": "2026-08-25",
        "category": "Travel",
        "notes": "Indigo Airlines flight + airport taxi"
    },
    files={"file": ("tax_invoice_flight.pdf", io.BytesIO(sample_pdf), "application/pdf")}
)
assert upload_res.status_code == 201
receipt_data = upload_res.json()
receipt_id = receipt_data["id"]
print(f"    Created Receipt: ID={receipt_id} | Status={receipt_data['status']} | Amount=INR {receipt_data['amount']}")

# Check file on physical disk
cursor.execute("SELECT stored_file_name, file_path, file_size, original_file_name, status, amount FROM receipts WHERE id = ?", (receipt_id,))
r_row = cursor.fetchone()
print(f"    Stored File Name on Disk: {r_row[0]}")
print(f"    Full Disk Path: {r_row[1]}")
print(f"    Original User File Name: {r_row[3]}")
print(f"    File Exists on Filesystem: {os.path.exists(r_row[1])}")
assert os.path.exists(r_row[1]), "Uploaded file missing from disk!"
assert r_row[4] == "PENDING", "Initial receipt status must be PENDING!"

# -------------------------------------------------------------
# 6. MULTI-TENANT ISOLATION & IDOR DEFENSE AUDIT
# -------------------------------------------------------------
print("\n[6] Testing Multi-Tenant Isolation & IDOR Defense...")
reg_bob = client.post("/api/auth/register", json={
    "fullName": "Bob Hacker",
    "email": "bob.audit@example.com",
    "password": "BobPassword123!",
    "confirmPassword": "BobPassword123!"
})
if reg_bob.status_code == 201:
    bob_token = reg_bob.json()["access_token"]
else:
    log_b = client.post("/api/auth/login", json={"email": "bob.audit@example.com", "password": "BobPassword123!"})
    bob_token = log_b.json()["access_token"]

# Bob tries to view Alice's receipt
bob_view_alice = client.get(f"/api/receipts/{receipt_id}", headers={"Authorization": f"Bearer {bob_token}"})
print("    Bob reads Alice Receipt -> Status:", bob_view_alice.status_code, "(Expected 403 Forbidden)")
assert bob_view_alice.status_code == 403

# Bob tries to download Alice's document file
bob_dl_alice = client.get(f"/api/receipts/{receipt_id}/file", headers={"Authorization": f"Bearer {bob_token}"})
print("    Bob downloads Alice File -> Status:", bob_dl_alice.status_code, "(Expected 403 Forbidden)")
assert bob_dl_alice.status_code == 403

# Bob tries to approve Alice's receipt
bob_appr = client.patch(f"/api/admin/receipts/{receipt_id}/approve", headers={"Authorization": f"Bearer {bob_token}"})
print("    Bob calls Admin Approve -> Status:", bob_appr.status_code, "(Expected 403 Forbidden)")
assert bob_appr.status_code == 403

# -------------------------------------------------------------
# 7. ADMIN REVIEW & WEBSOCKET PUSH AUDIT
# -------------------------------------------------------------
print("\n[7] Testing Admin Review Workflow & Real-Time Push...")
admin_login = client.post("/api/auth/login", json={"email": "admin@clearclaim.internal", "password": "SuperAdminSecret123!"})
admin_token = admin_login.json()["access_token"]

# Connect Alice WebSocket client
with client.websocket_connect(f"/ws/notifications/{alice_id}") as ws:
    # Admin approves Alice's receipt
    admin_appr = client.patch(
        f"/api/admin/receipts/{receipt_id}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"reviewComment": "Verified against travel itinerary. Approved."}
    )
    assert admin_appr.status_code == 200
    print("    Admin Approved Receipt -> Status is now:", admin_appr.json()["status"])
    print("    Review Comment Saved:", admin_appr.json()["reviewComment"])
    print("    Reviewed By:", admin_appr.json()["reviewedBy"]["fullName"])

    # Verify Alice receives real-time WebSocket push
    push_data = json.loads(ws.receive_text())
    print("    Real-Time WebSocket Push Received by Alice:")
    print(f"      Type: {push_data['type']}")
    print(f"      Status: {push_data['status']}")
    print(f"      Reviewer: {push_data['reviewedBy']}")
    assert push_data["status"] == "APPROVED"

# Test double review conflict
double_rev = client.patch(f"/api/admin/receipts/{receipt_id}/approve", headers={"Authorization": f"Bearer {admin_token}"})
print("    Repeated Review on Approved Receipt -> Status:", double_rev.status_code, "(Expected 409 Conflict)")
assert double_rev.status_code == 409

# -------------------------------------------------------------
# 8. EXPORT VERIFICATION (CSV & EXCEL)
# -------------------------------------------------------------
print("\n[8] Testing Export Services...")
csv_res = client.get("/api/admin/receipts/export/csv", headers={"Authorization": f"Bearer {admin_token}"})
assert csv_res.status_code == 200
assert "text/csv" in csv_res.headers["content-type"]
print("    CSV Export Generated successfully (Content-Type: text/csv)")

excel_res = client.get("/api/admin/receipts/export/excel", headers={"Authorization": f"Bearer {admin_token}"})
assert excel_res.status_code == 200
assert "spreadsheetml" in excel_res.headers["content-type"]
print("    Excel (.xlsx) Export Generated successfully (Size:", len(excel_res.content), "bytes)")

conn.close()
print("\n===============================================================")
print("   ALL AUDITS PASSED WITH 100% SUCCESS & ZERO VULNERABILITIES!")
print("===============================================================")
