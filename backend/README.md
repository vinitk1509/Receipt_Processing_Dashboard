# Backend API — Receipt Processing Dashboard

FastAPI REST API and WebSocket notification service for the Receipt Processing Dashboard.

---

## Directory Layout

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entrypoint & middleware configuration
│   ├── api/
│   │   ├── dependencies.py     # Database session & JWT authentication providers
│   │   └── routes/
│   │       ├── auth.py         # Registration & login routes
│   │       ├── receipts.py     # User receipt upload & listing routes
│   │       └── admin.py        # Admin review, filtering & export routes
│   ├── core/
│   │   ├── config.py           # Application settings loaded via pydantic-settings
│   │   ├── security.py         # Argon2id hashing & PyJWT token utilities
│   │   └── notifications.py    # In-memory WebSocket connection manager
│   ├── db/
│   │   └── database.py         # SQLAlchemy engine, SessionLocal & Base declaration
│   ├── models/
│   │   ├── enums.py            # UserRole, ReceiptStatus, ReceiptCategory
│   │   ├── user.py             # User ORM model
│   │   └── receipt.py          # Receipt ORM model
│   ├── schemas/
│   │   ├── base.py             # CamelModel for camelCase JSON serialization
│   │   ├── token.py            # Token schemas
│   │   ├── user.py             # User request/response schemas
│   │   └── receipt.py          # Receipt request/response schemas
│   ├── scripts/
│   │   └── create_admin.py     # CLI admin provisioning script
│   └── services/
│       ├── auth_service.py     # Authentication business logic
│       ├── receipt_service.py  # Receipt creation, storage & ownership logic
│       ├── admin_service.py    # Admin review & broadcast logic
│       └── export_service.py   # In-memory CSV and openpyxl Excel generators
├── tests/                      # Automated Pytest suite
├── Dockerfile                  # Docker build definition
└── requirements.txt            # Python dependencies
```

---

## Environment Variables

Copy `.env.example` to `.env` or set the following environment variables:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./receipt_dashboard.db` | Database connection string |
| `SECRET_KEY` | *(Set in .env)* | HMAC-SHA256 secret key for signing JWTs |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Lifespan of JWT access tokens |
| `MAX_UPLOAD_SIZE_MB` | `10` | Maximum file upload size in megabytes |
| `FRONTEND_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins |

---

## Local Development

1. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\Activate.ps1
   # macOS/Linux:
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. Interactive API Documentation:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

---

## Running Tests

Run the full automated test suite:

```bash
pytest -v
```
