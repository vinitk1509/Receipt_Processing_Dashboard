import sys
from app.db.database import SessionLocal, Base, engine
import app.db.base  # Ensure models are loaded
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import hash_password


def seed_demo_accounts() -> None:
    """Seed default demo USER and ADMIN accounts safely and idempotently."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        demo_accounts = [
            {
                "email": "user2@gmail.com",
                "password": "Password123",
                "role": UserRole.USER,
                "full_name": "Test User",
            },
            {
                "email": "vinitkumar1@gmail.com",
                "password": "Password123",
                "role": UserRole.ADMIN,
                "full_name": "Vinit Kumar Arora",
            },
        ]

        for acc in demo_accounts:
            email_normalized = acc["email"].strip().lower()
            existing = db.query(User).filter(User.email == email_normalized).first()

            if existing:
                existing.full_name = acc["full_name"]
                existing.hashed_password = hash_password(acc["password"])
                if email_normalized == "vinitkumar1@gmail.com" or acc["role"] == UserRole.ADMIN:
                    existing.role = UserRole.ADMIN
                db.commit()
                db.refresh(existing)
                print(f"[INFO] Updated existing account '{email_normalized}' ({existing.role.value}) (ID: {existing.id})")
            else:
                new_user = User(
                    full_name=acc["full_name"],
                    email=email_normalized,
                    hashed_password=hash_password(acc["password"]),
                    role=acc["role"],
                )
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                print(f"[SUCCESS] Created new account '{email_normalized}' ({new_user.role.value}) (ID: {new_user.id})")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed demo accounts: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def main() -> None:
    seed_demo_accounts()


if __name__ == "__main__":
    main()
