# Receipt Processing Dashboard

A professional expense receipt submission and approval system for internal finance teams.

Built by **Vinit** as part of a full-stack technical assessment project.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| HTTP client | Axios |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── api/              # Axios instance + API service functions
├── components/
│   ├── layout/       # AppShell, Sidebar, Header, Page wrapper
│   └── ui/           # StatusBadge, Toast, ConfirmDialog, Skeleton, Button
├── context/          # AuthContext — authentication state
├── data/             # Development mock data (replaced by API calls in production)
├── lib/              # Utility functions (currency, date formatting)
├── pages/
│   ├── auth/         # Login, Register
│   ├── user/         # Dashboard, My Receipts, Submit Receipt, Receipt Detail, Account
│   └── admin/        # Admin Dashboard, Receipt Reviews, Review Detail, Approved Receipts
├── routes/           # ProtectedRoute — auth & role guards
└── types/            # TypeScript interfaces and enums
```

---

## Getting Started

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| User | `alex@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |

> Both accounts are for development demonstration only.

---

## Environment Variables

Copy `.env.example` to `.env` and set your API URL:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## Roles

| Role | Capabilities |
|------|-------------|
| `USER` | Submit receipts, view own submissions, track review status |
| `ADMIN` | View all receipts, approve/reject with comments, export reports |

---

## Receipt Statuses

| Status | Meaning |
|--------|---------|
| `PENDING` | Submitted, awaiting admin review |
| `APPROVED` | Approved for reimbursement |
| `REJECTED` | Rejected with admin comment |

---

## Backend Integration

The frontend is built ready to connect to a **Python FastAPI** backend.

All API calls are centralized in `src/api/`:

- `authApi.ts` — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `receiptApi.ts` — `POST /api/receipts`, `GET /api/receipts/me`, `GET /api/receipts/:id`
- `adminApi.ts` — `GET /api/admin/receipts`, `PATCH /api/admin/receipts/:id/approve|reject`

To go live: remove `src/data/mockData.ts`, replace the mock bodies in `AuthContext.tsx` and page submit handlers with the real API calls already defined in `src/api/`.

---

## Other Commands

```bash
npm run build       # Production build
npm run preview     # Preview production build locally
npm run type-check  # TypeScript check without building
```
