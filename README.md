# 🧾 Clearclaim — Receipt Processing Dashboard

An enterprise-grade, full-stack **Receipt & Document Processing Platform** designed for corporate expense management, document verification, and accounting workflows in **Australian Dollars ($ AUD)**.

Built for **Sequus Consulting (Australia)** technical assessment.

---

## 🌟 Key Features

### 👤 User Capabilities (Submitter)
- **Interactive Expense Submission:** Upload PDF, PNG, or JPEG receipts with automatic client-side & server-side validation (max 10MB, future-date block).
- **Sequus-Tailored Expense Categories:** 8 specialized categories (*Travel & Site Visits*, *Site & Safety Equipment*, *Software & Cloud Licenses*, *Client Meetings & Dining*, *Accommodation & Per Diem*, etc.).
- **Live Status Tracking:** Real-time visibility into whether claims are `PENDING`, `APPROVED`, or `REJECTED`.
- **Instant In-App Document Lightbox:** Interactive modal featuring **mouse-wheel zoom (50%–400%)**, sandboxed PDF viewer, and pan navigation.
- **⚡ Real-Time WebSocket Push Notifications:** Submitter receives immediate, live browser toast alerts the exact millisecond an administrator reviews their claim.

### 🛡️ Administrator Capabilities (Reviewer)
- **Organization-Wide Overview:** Live overview metrics, total approved expense volume ($ AUD), and active review queues.
- **Multi-Dimensional Filter Workbench:** Filter submissions across Submitter, Status (`ALL`, `PENDING`, `APPROVED`, `REJECTED`), Date Range (`From:` / `To:`), and Expense Category.
- **Live Submitter Alert & Zero-Reload Sync:** Admin dashboard and review queue automatically update in real time when any employee submits a receipt.
- **Review & Audit Feedback:** One-click Approve / Reject with audit feedback comments.
- **In-Memory Streaming Exports:** Generate and download formatted **CSV** and styled **Excel (`.xlsx`)** spreadsheets on-the-fly directly from memory.

---

## 🏗️ Architecture & Technology Stack

```
   Browser Client (React 18 + TypeScript + TailwindCSS + Lucide)
                       │
       HTTP REST (Axios) / Native WebSockets
                       │
                       ▼
   FastAPI Web Framework (Python 3.12 + ASGI + Uvicorn)
   ├── Security & RBAC: Argon2id (pwdlib) + PyJWT (HS256) + Strict IDOR Isolation
   ├── Data Access: SQLAlchemy 2.0 ORM (Parameterized Queries)
   ├── In-Memory Export: openpyxl + csv (Zero-Disk RAM Streaming)
   └── Real-Time Hub: In-Memory WebSocket ConnectionManager
                       │
                       ▼
   Storage: SQLite Database (`receipt_dashboard.db`) + Local Uploads Volume
```

---

## 🚀 Quick Start Guide

You can run the entire application using **Docker (1-command)** or **Local Development**.

---

### Option A: 🐳 Docker Compose (Recommended)

Make sure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is running, then run:

```bash
docker compose up --build
```

- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

To stop the containers:
```bash
docker compose down
```

---

### Option B: 💻 Local Manual Development

#### 1. Start Backend (Terminal 1)
```bash
cd backend
python -m venv .venv
# Activate Virtual Environment:
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*Backend runs at [http://127.0.0.1:8000](http://127.0.0.1:8000)*

#### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at [http://localhost:5173](http://localhost:5173)*

---

## 🔑 Provisioning the Administrator Account

To create or promote an admin user, run the CLI utility:

```bash
# In backend/ folder (with virtualenv active):
python -m app.scripts.create_admin --email admin@sequus.com.au --password "AdminPassword123" --name "Sequus Admin"
```

---

## 🧪 Automated Test Suite

The repository includes a 100% passing Pytest integration test suite covering authentication, multi-tenant IDOR isolation, admin workflows, WebSockets, and exports.

```bash
cd backend
pytest -v
```

```text
tests/test_admin_workflow.py::test_admin_workflow_and_rbac PASSED        [ 25%]
tests/test_auth.py::test_user_registration_and_login PASSED              [ 50%]
tests/test_phase5_export.py::test_exports PASSED                         [ 75%]
tests/test_receipts_isolation.py::test_receipt_creation_and_cross_user_isolation PASSED [100%]

======================== 4 passed in 1.60s =========================
```

---

## 📚 Complete Learning & Interview Guide

For a 65-part deep dive explaining every file, line of code, Spring Boot equivalent, security mechanism, and interview defense:
👉 See **[`SEQUUS_PROJECT_COMPLETE_EXPLANATION.md`](./SEQUUS_PROJECT_COMPLETE_EXPLANATION.md)**.
