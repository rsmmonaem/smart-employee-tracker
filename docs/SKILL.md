# SKILL.md — TimeGuard SaaS (Workfolio-Clone) — Full Rewrite Edition
> **Read this file completely before touching any code in this repo.**
> Every other file implements a piece of what is described here.
> This document is the source of truth for product, architecture, data model,
> API contract, build order, and agent instructions — designed so any IDE,
> AI coding agent (Claude Code, Cursor, Copilot Workspace, Antigravity, etc.)
> or new developer can onboard with zero verbal briefing.

---

## 0. What this Product Is

**TimeGuard** is a multi-tenant SaaS for employee time tracking, attendance,
and productivity monitoring — feature-equivalent to **getworkfolio.com**.

Core feature set:
- **Clock-in / Clock-out / Breaks** (attendance)
- **App + Website usage tracking** (active-window polling)
- **Idle detection** (no keyboard/mouse → idle period)
- **Screenshot capture** with configurable interval
- **Timelapse video** assembled from daily screenshots
- **Productivity scoring** via tenant-defined rules (app/domain → score)
- **Alerts engine** (idle-too-long, low-productivity, anomalies)
- **Timesheets** with CSV / XLSX export
- **Two tracking modes**: `VISIBLE` (tray icon, employee-controlled) and
  `STEALTH` (invisible background process, auto-clock-in on login)
- **Three-tier role system** (see §1)
- **Desktop agents** for **Windows, macOS, Linux** (built with Tauri 2 + Rust)

---

## 1. Roles (Three-Tier, Multi-Tenant SaaS)

```
SUPER ADMIN  ───  owns the platform itself
   │              manages ALL tenants: create / suspend / change plan /
   │              view platform-wide storage+billing / impersonate-for-support
   │
TENANT ADMIN ───  a company that bought the SaaS (e.g. "Acme Corp")
   │              manages ONLY their org: employees, teams, rules, settings
   │              sees ONLY rows where tenant_id = their own tenant_id (RLS)
   │
EMPLOYEE     ───  tracked user; installs desktop agent
                  sees ONLY own data (my-day, my-timeline, my-timesheet)
```

### Tenant Isolation Invariant (most critical rule in the codebase)
Every Supabase table except `tenants` and `platform_settings` has a
`tenant_id uuid NOT NULL` column.  Supabase **Row-Level Security (RLS)** is
enabled on every such table — policies ensure a Tenant Admin can never see
another tenant's rows.  The Rust API layer adds a second defence: every
handler injects `tenant_id` from the JWT claim, never from a request body.

---

## 2. Tech Stack (canonical — do not substitute without updating this doc)

| Layer | Technology | Notes |
|---|---|---|
| **Database** | Supabase (PostgreSQL 15 + RLS) | hosted; schema via migrations |
| **Auth** | Supabase Auth (email+password, JWT) | anon key for desktop, service_role for backend |
| **File Storage** | Supabase Storage | bucket: `screenshots` |
| **Backend API** | Rust — Axum 0.7 + SQLx 0.7 | `apps/api/` |
| **Frontend** | Next.js 14 (App Router, TypeScript) | `apps/web/` |
| **Desktop Agent** | Tauri 2 + Rust | `apps/desktop-agent/` |
| **Shared types** | Rust workspace crate `crates/shared` | DTOs shared between api and agent |
| **Monorepo** | Cargo workspace + npm workspaces | root `Cargo.toml` + root `package.json` |

---

## 3. Monorepo Layout

```
workfolio-clone/
├── Cargo.toml                   ← Cargo workspace root
├── package.json                 ← npm workspace root
├── .env.example                 ← all secrets listed here, never commit .env
│
├── crates/
│   └── shared/                  ← Rust library crate: DTOs, enums, error types
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           ├── models.rs        ← Rust structs mirroring DB rows (serde + sqlx FromRow)
│           └── dto.rs           ← request/response types for API and agent
│
├── apps/
│   ├── api/                     ← Axum HTTP server
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── main.rs
│   │       ├── config.rs        ← env config (Supabase URL, keys, secrets)
│   │       ├── db.rs            ← SQLx pool init (connects to Supabase Postgres)
│   │       ├── auth/            ← JWT middleware, Supabase Auth helpers
│   │       ├── middleware/      ← tenant_guard, role_guard
│   │       ├── routes/
│   │       │   ├── mod.rs
│   │       │   ├── auth.rs
│   │       │   ├── superadmin.rs
│   │       │   ├── tenant_admin.rs
│   │       │   ├── employee.rs
│   │       │   └── agent.rs     ← desktop agent ingestion endpoints
│   │       └── services/        ← business logic (productivity scorer, alert engine)
│   │
│   ├── web/                     ← Next.js 14 App Router
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (superadmin)/   ← /superadmin/* — role-gated
│   │       │   ├── (admin)/        ← /admin/* — role-gated
│   │       │   ├── (employee)/     ← /employee/* — role-gated
│   │       │   └── login/
│   │       ├── components/
│   │       ├── lib/
│   │       │   ├── supabase.ts     ← browser Supabase client
│   │       │   └── api.ts          ← typed fetch wrappers to Rust API
│   │       └── types/
│   │
│   └── desktop-agent/           ← Tauri 2 app
│       ├── Cargo.toml
│       ├── package.json         ← Vite frontend for Tauri shell UI
│       ├── src-tauri/
│       │   ├── Cargo.toml
│       │   └── src/
│       │       ├── main.rs
│       │       ├── config.rs
│       │       ├── tracker/
│       │       │   ├── mod.rs
│       │       │   ├── active_window.rs   ← active-window polling (platform-specific)
│       │       │   ├── idle.rs            ← idle detection via last-input timestamps
│       │       │   ├── screenshot.rs      ← screen capture → Supabase Storage
│       │       │   └── event_queue.rs     ← offline-safe SQLite queue, batch flush
│       │       ├── clock.rs               ← clock-in/out/break state machine
│       │       ├── tray.rs                ← system tray (Tauri tray API)
│       │       └── commands.rs            ← Tauri commands exposed to frontend
│       └── src/                           ← Vite+React UI inside Tauri window
│           ├── App.tsx
│           ├── pages/
│           │   ├── Settings.tsx
│           │   └── ClockWidget.tsx
│           └── styles/
│
├── supabase/
│   ├── config.toml              ← local Supabase dev config
│   └── migrations/              ← all SQL migration files (numbered)
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       └── 003_storage_buckets.sql
│
└── docs/
    ├── SKILL.md                 ← this file (source of truth)
    ├── db-schema.md             ← full table/column reference
    ├── api-contract.md          ← all HTTP endpoints
    └── desktop-agent-pipeline.md ← tracker event lifecycle
```

---

## 4. Supabase Database Schema

### Enums
```sql
CREATE TYPE user_role       AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'EMPLOYEE');
CREATE TYPE tenant_status   AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
CREATE TYPE tenant_plan     AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');
CREATE TYPE tracking_mode   AS ENUM ('VISIBLE', 'STEALTH');
CREATE TYPE classification  AS ENUM ('PRODUCTIVE', 'NEUTRAL', 'UNPRODUCTIVE');
CREATE TYPE alert_type      AS ENUM ('IDLE_TOO_LONG','LOW_PRODUCTIVITY','ATTENDANCE_ANOMALY');
CREATE TYPE alert_severity  AS ENUM ('INFO','WARNING','CRITICAL');
CREATE TYPE match_type      AS ENUM ('APP','DOMAIN');
```

### Tables

```sql
tenants (
  id uuid PK, name text, slug text UNIQUE, plan tenant_plan,
  status tenant_status, screenshot_interval_sec int DEFAULT 300,
  retention_days int DEFAULT 30, storage_quota_mb int DEFAULT 5000,
  max_teams int DEFAULT 5, max_seats int DEFAULT 10,
  created_at timestamptz, updated_at timestamptz
)

users (
  id uuid PK REFERENCES auth.users(id),
  tenant_id uuid REFERENCES tenants(id),   -- NULL for SUPER_ADMIN
  role user_role NOT NULL,
  tracking_mode tracking_mode DEFAULT 'VISIBLE',
  full_name text, email text UNIQUE,
  avatar_url text, consent_at timestamptz,
  device_token_hash text,   -- hashed UUID issued to desktop agent
  is_active bool DEFAULT true,
  created_at timestamptz
)

teams         (id uuid PK, tenant_id uuid, name text, description text, created_at timestamptz)
team_members  (team_id uuid, user_id uuid, tenant_id uuid, PRIMARY KEY (team_id, user_id))

attendance_sessions (
  id uuid PK, tenant_id uuid, user_id uuid,
  clocked_in_at timestamptz, clocked_out_at timestamptz,
  total_break_sec int DEFAULT 0, status text
)
break_periods (id uuid PK, session_id uuid, tenant_id uuid, user_id uuid,
               started_at timestamptz, ended_at timestamptz)

activity_events (
  id uuid PK, tenant_id uuid, user_id uuid,
  app_name text, window_title text, domain text,
  started_at timestamptz, ended_at timestamptz,
  classification classification, created_at timestamptz
)
idle_periods    (id uuid PK, tenant_id uuid, user_id uuid,
                 started_at timestamptz, ended_at timestamptz)

screenshots   (id uuid PK, tenant_id uuid, user_id uuid,
               storage_path text, taken_at timestamptz,
               is_blurred bool DEFAULT false, created_at timestamptz)
timelapse_jobs (id uuid PK, tenant_id uuid, user_id uuid,
                date date, status text, video_path text, created_at timestamptz)

productivity_rules (id uuid PK, tenant_id uuid, match_type match_type,
                    pattern text, classification classification,
                    priority int DEFAULT 0, created_at timestamptz)
alert_rules   (id uuid PK, tenant_id uuid, type alert_type,
               threshold_sec int, threshold_pct int, is_active bool DEFAULT true)
alerts        (id uuid PK, tenant_id uuid, user_id uuid,
               type alert_type, severity alert_severity,
               payload jsonb, is_read bool DEFAULT false, triggered_at timestamptz)

audit_logs    (id uuid PK, actor_id uuid, target_user_id uuid,
               action text, metadata jsonb, created_at timestamptz)
platform_settings (key text PK, value jsonb, updated_at timestamptz)
```

---

## 5. API Endpoints (full reference in docs/api-contract.md)

Base URL: `http://localhost:8080/api/v1`
Auth: `Authorization: Bearer <supabase_jwt>`
All list responses: `{ data: T[], page: u32, page_size: u32, total: u64 }`

### Auth
```
POST /auth/login        { email, password } → { access_token, refresh_token, user }
POST /auth/refresh      { refresh_token }   → { access_token }
POST /auth/logout
```

### Super Admin (role = SUPER_ADMIN only)
```
GET    /admin/tenants
POST   /admin/tenants              { name, slug, plan, admin_email, admin_name }
PATCH  /admin/tenants/:id          { plan?, status?, limits? }
POST   /admin/tenants/:id/suspend
GET    /admin/usage
POST   /admin/impersonate/:uid     → short-lived scoped token (audit-logged)
GET    /admin/audit-logs
```

### Tenant Admin (role = TENANT_ADMIN, all scoped to JWT tenant_id)
```
GET/POST           /employees
GET/PATCH/DELETE   /employees/:id
GET/POST           /teams
PATCH/DELETE       /teams/:id
POST               /teams/:id/members

GET  /timeline?user_id=&date=
GET  /attendance?user_id=&from=&to=
GET  /apps/usage?user_id=&date=
GET  /websites/usage?user_id=&date=
GET  /screenshots?user_id=&date=
GET  /timelapse?user_id=&date=
GET  /productivity/summary?user_id=&range=

GET/POST/PATCH/DELETE  /rules
GET/POST/PATCH         /alert-rules
GET                    /alerts?is_read=false
PATCH                  /alerts/:id/read

GET  /timesheets?user_id=&range=
GET  /timesheets/export?format=csv|xlsx

PATCH /settings
```

### Employee (self-scoped)
```
POST  /me/clock-in
POST  /me/clock-out
POST  /me/break/start
POST  /me/break/end
GET   /me/timeline?date=
GET   /me/timesheet?range=
GET   /me/productivity?range=
```

### Desktop Agent (device_token auth)
```
POST  /agent/events               batched event array
POST  /agent/screenshots          multipart PNG upload
GET   /agent/config               returns tracking_mode, screenshot_interval, idle_threshold
POST  /agent/heartbeat            { agent_version, os, ts }
GET   /agent/screenshot-upload-url → presigned Supabase Storage URL
```

---

## 6. Desktop Agent Event Pipeline

```
Local Machine (Tauri/Rust background threads)
  │
  ├─ active_window::poll()   every 5 s  →  { app_name, window_title, domain? }
  ├─ idle::monitor()         every 1 s  →  last-input timestamp → IdlePeriod start/end
  ├─ screenshot::capture()   interval from agent/config → PNG file
  ├─ clock::state_machine()  CLOCKED_OUT → CLOCKED_IN → ON_BREAK → CLOCKED_IN
  └─ event_queue::flush()    every 30 s → POST /agent/events  (offline-safe SQLite queue)
          │
          ▼
  Axum API  →  classify via ProductivityRule lookup  →  Supabase Postgres
          │
          ▼
  Dashboard reads aggregated Timeline / Productivity / Alerts
```

Offline-safety: agent writes all events to local SQLite first; flush loop
retries with exponential back-off; batch deleted only on HTTP 200.

Cross-platform active-window:
- macOS  : NSWorkspace.shared.frontmostApplication (objc2 crate or active-win-pos-rs)
- Windows: GetForegroundWindow + GetWindowTextW (windows-rs)
- Linux X11: xcb query or xdotool
- Linux Wayland: ydotool + compositor extension (best-effort)

---

## 7. Dashboard Information Architecture (implement exactly)

```
SUPER ADMIN                      TENANT ADMIN                    EMPLOYEE
├─ Platform Overview             ├─ Overview                     ├─ My Day (clock in/out)
├─ Tenants                       ├─ Timeline                     ├─ My Timeline
│   ├─ List / Search             ├─ Employees                    ├─ My Timesheet
│   ├─ Create Tenant             ├─ Teams                        ├─ My Productivity
│   └─ Tenant Detail             ├─ Timesheets                   └─ Settings
├─ Billing & Plans               ├─ Attendance
├─ Global Usage & Storage        ├─ Apps
├─ Support / Impersonate         ├─ Websites
├─ Audit Logs                    ├─ Screenshots
└─ Platform Settings             ├─ Timelapse
                                 ├─ Productivity
                                 ├─ Alerts
                                 ├─ Rules
                                 ├─ Reports
                                 ├─ Exports
                                 └─ Settings
                                     ├─ Organization
                                     ├─ Teams
                                     ├─ Tracking
                                     ├─ Productivity Rules
                                     ├─ Notifications
                                     ├─ Billing
                                     └─ Account
```

---

## 8. Build Order (implement phases in sequence)

### Phase 1 — Foundation
- [ ] Supabase project: enable Auth, create Storage bucket `screenshots`
- [ ] SQL migrations 001, 002, 003
- [ ] Cargo workspace root + `crates/shared` (DTOs, enums, error types)
- [ ] `apps/api`: Axum skeleton, SQLx pool, config from .env
- [ ] API: auth routes (delegate to Supabase Auth, return JWT)
- [ ] API: JWT middleware + tenant_guard + role_guard
- [ ] API: GET /health

### Phase 2 — Tenant Admin API + Web
- [ ] API: employees CRUD, teams CRUD + members
- [ ] API: timeline, attendance endpoints
- [ ] Web: Next.js 14 project, Supabase client, auth flow
- [ ] Web: /login, /admin/employees, /admin/timeline, /admin/teams, /admin/attendance

### Phase 3 — Desktop Agent MVP (Tauri 2)
- [ ] Tauri 2 project setup (targets: Windows + macOS + Linux)
- [ ] Active-window polling (platform-specific)
- [ ] Idle detection
- [ ] Local SQLite event queue
- [ ] Batch flush to POST /agent/events
- [ ] Clock-in/out state machine
- [ ] System tray (Visible mode)
- [ ] Settings window (device_token + server URL)
- [ ] GET /agent/config consumption

### Phase 4 — Productivity + Rules + Timesheets
- [ ] API: productivity rules CRUD, classification at write-time
- [ ] API: productivity summary, timesheets + CSV/XLSX export
- [ ] Web: /admin/rules, /admin/productivity, /admin/timesheets
- [ ] Web: /employee/* pages

### Phase 5 — Screenshots + Timelapse
- [ ] Agent: screenshot capture → Supabase Storage
- [ ] API: screenshot list, timelapse job trigger + ffmpeg assembly
- [ ] Web: /admin/screenshots, /admin/timelapse

### Phase 6 — Super Admin Portal
- [ ] API: super-admin routes (tenants, usage, impersonate, audit)
- [ ] Web: /superadmin/* portal
- [ ] Seed script for first SUPER_ADMIN user

### Phase 7 — Alerts Engine
- [ ] Alert rules CRUD
- [ ] Cron job (tokio-cron-scheduler) evaluating rules against recent data
- [ ] In-app notifications
- [ ] Web: /admin/alerts, /admin/alert-rules

### Phase 8 — Stealth Mode + Auto-Update + Installers
- [ ] Stealth mode (no tray, auto-clock-in on OS login via startup registration)
- [ ] Tauri updater (auto-update endpoint)
- [ ] Code signing: Windows EV cert, macOS Developer ID + notarize
- [ ] Installers: NSIS (Windows), DMG (macOS), AppImage + deb (Linux)

---

## 9. Environment Variables (.env.example)

```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-side only — NEVER expose to browser/agent

# Database (direct Postgres for SQLx)
DATABASE_URL=postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres

# API Server
API_PORT=8080
JWT_SECRET=...         # must match Supabase JWT secret for verification
RUST_LOG=info

# Desktop Agent (stored in agent local config, not .env)
AGENT_API_URL=http://localhost:8080/api/v1
DEVICE_TOKEN=...       # issued per-employee by Tenant Admin
```

---

## 10. Key Rust Crates

```toml
# apps/api / Cargo.toml [dependencies]
axum               = "0.7"
tokio              = { version = "1", features = ["full"] }
sqlx               = { version = "0.7", features = ["postgres","uuid","chrono","runtime-tokio-rustls"] }
tower-http         = { version = "0.5", features = ["cors","trace"] }
serde              = { version = "1", features = ["derive"] }
serde_json         = "1"
uuid               = { version = "1", features = ["v4","serde"] }
chrono             = { version = "0.4", features = ["serde"] }
jsonwebtoken       = "9"
bcrypt             = "0.15"
reqwest            = { version = "0.11", features = ["json","multipart"] }
tokio-cron-scheduler = "0.10"
anyhow             = "1"
thiserror          = "1"

# apps/desktop-agent/src-tauri / Cargo.toml [dependencies]
tauri              = { version = "2", features = ["tray-icon"] }
rusqlite           = { version = "0.31", features = ["bundled"] }
reqwest            = { version = "0.11", features = ["json","multipart"] }
screenshots        = "0.8"
active-win-pos-rs  = "0.8"
```

---

## 11. Next.js Key Dependencies (apps/web/package.json)

```json
{
  "dependencies": {
    "next": "14",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3",
    "recharts": "^2",
    "date-fns": "^3",
    "react-hook-form": "^7",
    "zod": "^3",
    "@tanstack/react-query": "^5",
    "lucide-react": "^0.400"
  }
}
```

---

## 12. Legal / Consent Guardrails (do not skip)

1. Record employee consent at onboarding — `users.consent_at` timestamp.
2. Enforce data retention — cron deletes screenshots + activity_events older
   than `tenants.retention_days`.
3. Never capture keystroke *content* — only keyboard/mouse *activity presence*
   for idle detection.  Keylogging is explicitly out of scope.
4. Stealth mode disclosure — even in stealth mode most jurisdictions require
   written notice to employees; the platform records acknowledgment; legal
   notification is the tenant's responsibility.

---

## 13. Security Checklist

- [ ] All Supabase tables have RLS enabled and tested
- [ ] `service_role` key never sent to browser or desktop agent
- [ ] `tenant_id` always sourced from JWT claim, never from request body
- [ ] Device tokens are UUID v4, hashed in DB, compared with bcrypt
- [ ] Super-admin impersonation is audit-logged (actor + target + timestamp)
- [ ] Screenshot storage bucket is private (signed URLs only)
- [ ] CORS restricted to known origins in production
- [ ] Rate limiting on auth and agent ingestion endpoints

---

## 14. Replacing the Old Scaffold

The existing `apps/api` (Node/Express/Prisma) and `apps/desktop-agent`
(Electron) directories are superseded by this stack.  Delete them and
rebuild following Phases 1–8 above.  `apps/web` is also rebuilt as a fresh
Next.js 14 App Router project.

---

*End of SKILL.md — update this file whenever architecture, schema, or API
contract changes.  Never let it drift from the running code.*
