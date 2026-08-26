# Frontend Client — Receipt Processing Dashboard

React single-page application for the Receipt Processing Dashboard built with TypeScript, Vite, and Tailwind CSS.

---

## Directory Layout

```
frontend/
├── src/
│   ├── api/                  # Axios HTTP client instances & API endpoints
│   ├── components/
│   │   ├── layout/           # AppShell, Sidebar, Header, Page wrapper
│   │   └── ui/               # StatusBadge, Toast, FilePreviewModal, ConfirmDialog
│   ├── context/
│   │   ├── AuthContext.tsx   # Authentication state & localStorage persistence
│   │   └── NotificationContext.tsx # WebSocket listener & real-time toast dispatcher
│   ├── lib/
│   │   └── utils.ts          # Currency (AUD), date/time formatters, and class merge helper
│   ├── pages/
│   │   ├── auth/             # LoginPage, RegisterPage
│   │   ├── user/             # DashboardPage, ReceiptsPage, SubmitReceiptPage, ReceiptDetailPage, AccountPage
│   │   └── admin/            # AdminDashboardPage, ReceiptReviewsPage, ReceiptReviewDetailPage, ApprovedReceiptsPage
│   ├── routes/
│   │   └── ProtectedRoute.tsx# Role-based route guards
│   ├── types/
│   │   └── index.ts          # Domain interfaces & category enums
│   ├── App.tsx               # Route mapping & fallback redirection
│   ├── index.css             # Design tokens, typography & animations
│   └── main.tsx              # React DOM mounting
├── nginx.conf                # Production Nginx reverse-proxy configuration
├── Dockerfile                # Multi-stage production build definition
└── package.json              # NPM dependencies & scripts
```

---

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:5173`.

---

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite development server with Hot Module Reloading |
| `npm run build` | Compile TypeScript and bundle minified production assets in `dist/` |
| `npm run preview` | Locally preview the production build |
| `npm run lint` | Run ESLint across TypeScript and TSX source files |

---

## Environment Variables

Copy `.env.example` to `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

> In Docker / production, `VITE_API_BASE_URL` is left empty so requests use relative `/api` and `/ws` paths routed through the Nginx reverse proxy.
