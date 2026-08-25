import io
import openpyxl
from fastapi.testclient import TestClient
from app.main import app

def test_exports():
    client = TestClient(app)

    # Login Alice (USER)
    res_alice = client.post('/api/auth/login', json={'email': 'alice.test@example.com', 'password': 'Password123'})
    token_alice = res_alice.json()['access_token']

    # Login Admin (ADMIN)
    res_admin = client.post('/api/auth/login', json={'email': 'admin@example.com', 'password': 'AdminPassword123'})
    token_admin = res_admin.json()['access_token']

    # 1. Non-admin export CSV -> 403 Forbidden
    user_csv = client.get('/api/admin/receipts/export/csv', headers={'Authorization': f'Bearer {token_alice}'})
    assert user_csv.status_code == 403

    # 2. Admin export CSV -> 200 OK
    admin_csv = client.get('/api/admin/receipts/export/csv', headers={'Authorization': f'Bearer {token_admin}'})
    assert admin_csv.status_code == 200
    assert 'text/csv' in admin_csv.headers['content-type']
    assert 'attachment;' in admin_csv.headers['content-disposition']
    assert 'Receipt ID,Submitted By' in admin_csv.text

    # 3. Admin export Excel -> 200 OK
    admin_excel = client.get('/api/admin/receipts/export/excel', headers={'Authorization': f'Bearer {token_admin}'})
    assert admin_excel.status_code == 200
    assert 'spreadsheetml' in admin_excel.headers['content-type']
    assert 'attachment;' in admin_excel.headers['content-disposition']

    # Verify excel workbook is valid
    wb = openpyxl.load_workbook(io.BytesIO(admin_excel.content))
    assert 'Approved Receipts' in wb.sheetnames
    ws = wb.active
    assert ws.max_row >= 1
    print("\nPhase 5 Export tests passed successfully!")

if __name__ == "__main__":
    test_exports()
