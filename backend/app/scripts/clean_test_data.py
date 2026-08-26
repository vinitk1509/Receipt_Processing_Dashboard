import sqlite3
import os

conn = sqlite3.connect("receipt_dashboard.db")
c = conn.cursor()

# Find test users
c.execute("SELECT id, email FROM users WHERE email NOT IN (?, ?)", ("vinitk0568@gmail.com", "vinitkumar1@gmail.com"))
test_users = c.fetchall()
print(f"Found {len(test_users)} test users to delete.")

test_ids = [u[0] for u in test_users]
if test_ids:
    placeholders = ",".join("?" for _ in test_ids)
    
    # Delete test files
    c.execute(f"SELECT file_path FROM receipts WHERE user_id IN ({placeholders})", test_ids)
    for row in c.fetchall():
        if row[0] and os.path.exists(row[0]):
            try:
                os.remove(row[0])
            except Exception:
                pass

    # Delete test receipts and users
    c.execute(f"DELETE FROM receipts WHERE user_id IN ({placeholders})", test_ids)
    c.execute(f"DELETE FROM users WHERE id IN ({placeholders})", test_ids)
    conn.commit()

c.execute("SELECT id, full_name, email, role FROM users")
print("\nActive Users in Database:")
for u in c.fetchall():
    print(" ", u)

c.execute("SELECT id, title, amount, status FROM receipts")
print("\nActive Receipts in Database:")
for r in c.fetchall():
    print(" ", r)

conn.close()
