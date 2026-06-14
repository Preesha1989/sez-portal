# SEZ Compliance Portal

A full-stack compliance request management system for Special Economic Zone operations.

## Architecture

```
sez-portal/
├── backend/          # Node.js + Express + SQLite
│   └── src/
│       ├── routes/   # API route handlers
│       ├── models/   # DB schema & query helpers
│       ├── middleware/  # Auth, upload, validation
│       └── services/ # Business logic (assignment, audit)
└── frontend/         # React + Vite + TailwindCSS
    └── src/
        ├── pages/    # Landing, Form, Queue, Dashboard
        ├── components/  # Shared UI components
        ├── hooks/    # Data-fetching hooks
        └── lib/      # API client, constants
```

## Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, TailwindCSS       |
| Backend   | Node.js, Express 4                |
| Database  | SQLite (via better-sqlite3)       |
| File store| Local disk → swap to S3 in prod   |
| Auth      | JWT (role: requester / sez_team)  |

## Quick Start

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Backend runs on http://localhost:3001  
Frontend runs on http://localhost:5173

## API Base URL
All endpoints are prefixed `/api/v1`

## Roles
- `requester`  — any non-SEZ staff; can create & view own requests
- `sez_team`   — SEZ officers; full queue, status updates, assignment
- `sez_admin`  — same as sez_team + team management

## Key Design Decisions
- **Audit trail is append-only** — no UPDATE/DELETE on audit_log table
- **Idempotency keys** on submission prevent duplicate requests
- **File uploads** are stored at `/backend/uploads/{request_id}/`
- **Round-robin auto-assignment** cycles through active SEZ members
- **All status transitions are validated** server-side regardless of UI state
