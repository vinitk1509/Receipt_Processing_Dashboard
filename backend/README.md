# Clearclaim — Receipt Processing Backend API

A clean, enterprise-grade **FastAPI** backend for the **Receipt Processing Dashboard**, built with Python 3.12, SQLAlchemy 2.0, SQLite, Argon2 password hashing, and JWT stateless authentication.

---

## 🏛 Architecture & Spring Boot Mapping

For developers with a Java / Spring Boot background, this backend follows the same clean layered architecture:

| FastAPI Component | Spring Boot Equivalent | Purpose |
|---|---|---|
| `app/api/routes/*.py` | `@RestController` / `@RequestMapping` | REST API endpoints, routing, and HTTP status codes |
| `app/schemas/*.py` | DTOs (`record` / `@Valid`) | Request validation and camelCase JSON serialization |
| `app/models/*.py` | JPA `@Entity` / `@Table` | Database tables & SQLAlchemy ORM relationships |
| `app/services/*.py` | `@Service` | Core business logic, file storage, and state transitions |
| `app/api/dependencies.py` | `SecurityFilterChain` / `@PreAuthorize` | Dependency injection, DB sessions, JWT & role guards |
| `app/core/security.py` | `PasswordEncoder` (Argon2) & `JwtService` | Secure hashing & JWT encoding/decoding |
| `app/core/config.py` | `@ConfigurationProperties` | Type-safe environment settings with `pydantic-settings` |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 18+** (for frontend)

### 2. Setup Backend Virtual Environment

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install required dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```powershell
cp .env.example .env
```

Default contents:
```env
DATABASE_URL=sqlite:///./receipt_dashboard.db
SECRET_KEY=change-this-to-a-super-secret-hex-key-in-production-1234567890
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
MAX_UPLOAD_SIZE_MB=10
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

### 4. Create Development Administrator

Run the admin provisioning script:

```powershell
python -m app.scripts.create_admin --email admin@example.com --password AdminPassword123 --name "Priya Shah"
```

### 5. Start the FastAPI Server

```powershell
uvicorn app.main:app --reload --port 8000
```

- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 🧪 Running Automated Tests

Run the full automated test suite with `pytest`:

```powershell
pytest -v
```

The test suite covers:
- **Authentication**: User registration, password hashing with Argon2, duplicate email rejection (409), login validation, JWT verification.
- **Resource Ownership (IDOR Defense)**: Cross-user isolation ensuring User B cannot view or download User A's receipt.
- **RBAC**: Non-admin users blocked from admin review and export APIs (403 Forbidden).
- **Admin Workflow**: State transition from `PENDING` to `APPROVED`/`REJECTED`, mandatory rejection comment enforcement, and duplicate review prevention (409 Conflict).
- **Export Services**: In-memory generation and streaming of CSV and Excel (`.xlsx`) files.

---

## 🌐 Running Frontend with Live Backend

In a separate terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Demo Credentials
- **Admin Account**: `admin@example.com` / `AdminPassword123`
- **User Account**: Register a new user or login with `alex@example.com` / `Password123` (after registration)
