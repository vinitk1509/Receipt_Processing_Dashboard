import argparse
import sys
from app.db.database import SessionLocal, Base, engine
import app.db.base  # Ensure models are loaded
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import hash_password


def create_or_upgrade_admin(email: str, password: str, full_name: str):
    """Create a new ADMIN user or upgrade an existing user to ADMIN."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        normalized_email = email.strip().lower()
        existing = db.query(User).filter(User.email == normalized_email).first()

        if existing:
            existing.full_name = full_name
            existing.hashed_password = hash_password(password)
            existing.role = UserRole.ADMIN
            db.commit()
            db.refresh(existing)
            print(f"[SUCCESS] Upgraded existing user '{normalized_email}' to ADMIN (ID: {existing.id})")
        else:
            admin_user = User(
                full_name=full_name,
                email=normalized_email,
                hashed_password=hash_password(password),
                role=UserRole.ADMIN,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"[SUCCESS] Created new ADMIN user '{normalized_email}' (ID: {admin_user.id})")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to create admin: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Create or upgrade an administrator account for development.")
    parser.add_argument("--email", default="admin@example.com", help="Admin email address (default: admin@example.com)")
    parser.add_argument("--password", default="AdminPassword123", help="Admin password (default: AdminPassword123)")
    parser.add_argument("--name", default="Priya Shah", help="Admin full name (default: Priya Shah)")

    args = parser.parse_args()
    create_or_upgrade_admin(args.email, args.password, args.name)


if __name__ == "__main__":
    main()
