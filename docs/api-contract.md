# API Contract Reference — TimeGuard

Base URL  : `http://localhost:8080/api/v1`
Auth      : `Authorization: Bearer <supabase_jwt>`
Agent Auth: `X-Device-Token: <raw_device_token>`
All bodies/responses: `application/json`

List responses:
```json
{ "data": [...], "page": 1, "page_size": 20, "total": 150 }
```
All list endpoints support `?page=&page_size=` query params.

---

## Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | /auth/login | `{ email, password }` | `{ access_token, refresh_token, user }` |
| POST | /auth/refresh | `{ refresh_token }` | `{ access_token }` |
| POST | /auth/logout | — | 204 |

---

## Super Admin (`role = SUPER_ADMIN`)

| Method | Path | Notes |
|---|---|---|
| GET | /admin/tenants | list all tenants, plan, status, seat usage |
| POST | /admin/tenants | `{ name, slug, plan, admin_email, admin_name }` — creates tenant + first TENANT_ADMIN |
| PATCH | /admin/tenants/:id | `{ plan?, status?, screenshot_interval_sec?, retention_days?, max_seats?, max_teams? }` |
| POST | /admin/tenants/:id/suspend | suspends tenant (status → SUSPENDED) |
| GET | /admin/usage | platform-wide storage MB used, active seats per tenant |
| POST | /admin/impersonate/:user_id | issues short-lived scoped JWT; audit-logged |
| GET | /admin/audit-logs | paginated audit log |

---

## Tenant Admin (`role = TENANT_ADMIN`, all scoped to JWT `tenant_id`)

### Employees
| Method | Path | Notes |
|---|---|---|
| GET | /employees | list employees for this tenant |
| POST | /employees | `{ full_name, email }` → creates auth user, returns temp password + device_token |
| GET | /employees/:id | employee detail |
| PATCH | /employees/:id | `{ full_name?, tracking_mode?, is_active? }` |
| DELETE | /employees/:id | deactivates employee |

### Teams
| Method | Path | Notes |
|---|---|---|
| GET | /teams | |
| POST | /teams | `{ name, description? }` |
| PATCH | /teams/:id | |
| DELETE | /teams/:id | |
| POST | /teams/:id/members | `{ user_id }` |
| DELETE | /teams/:id/members/:user_id | |

### Monitoring
| Method | Path | Query | Notes |
|---|---|---|---|
| GET | /timeline | `user_id, date` | merged attendance+activity+idle+break stream for one day |
| GET | /attendance | `user_id, from, to` | attendance sessions list |
| GET | /apps/usage | `user_id, date` | aggregated time-per-app |
| GET | /websites/usage | `user_id, date` | aggregated time-per-domain |
| GET | /screenshots | `user_id, date` | list screenshots with signed URLs |
| GET | /timelapse | `user_id, date` | timelapse job status + video URL |
| GET | /productivity/summary | `user_id, range` (today\|week\|month) | % productive/neutral/unproductive |

### Rules & Alerts
| Method | Path | Notes |
|---|---|---|
| GET/POST | /rules | ProductivityRule list/create |
| PATCH/DELETE | /rules/:id | |
| GET/POST | /alert-rules | AlertRule list/create |
| PATCH | /alert-rules/:id | |
| GET | /alerts | `?is_read=false` — list alerts |
| PATCH | /alerts/:id/read | mark read |

### Timesheets & Settings
| Method | Path | Notes |
|---|---|---|
| GET | /timesheets | `user_id, range` — daily totals |
| GET | /timesheets/export | `format=csv\|xlsx` |
| PATCH | /settings | `{ tracking_mode_default?, screenshot_interval_sec? }` |

---

## Employee (self-scoped to JWT `user_id`)

| Method | Path | Notes |
|---|---|---|
| POST | /me/clock-in | opens AttendanceSession |
| POST | /me/clock-out | closes current session |
| POST | /me/break/start | starts BreakPeriod |
| POST | /me/break/end | ends current BreakPeriod |
| GET | /me/timeline | `?date=` |
| GET | /me/timesheet | `?range=` |
| GET | /me/productivity | `?range=` |

---

## Desktop Agent (authenticated via `X-Device-Token` header)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | /agent/events | `[{ type, ...payload, client_timestamp }]` | batched event array; types: `activity`, `idle_start`, `idle_end`, `clock_in`, `clock_out`, `break_start`, `break_end` |
| POST | /agent/screenshots | multipart/form-data: file + timestamp | uploads PNG; server stores in Supabase Storage |
| GET | /agent/config | — | returns `{ tracking_mode, screenshot_interval_sec, idle_threshold_sec }` |
| POST | /agent/heartbeat | `{ agent_version, os, ts }` | liveness ping |
| GET | /agent/screenshot-upload-url | — | returns presigned Supabase Storage URL for direct upload |

### Event payload shapes
```jsonc
// activity
{ "type": "activity", "app_name": "Visual Studio Code", "window_title": "main.rs", "domain": null,
  "started_at": "2025-01-15T09:00:00Z", "ended_at": "2025-01-15T09:05:00Z",
  "client_timestamp": "2025-01-15T09:05:01Z" }

// idle_start / idle_end
{ "type": "idle_start", "client_timestamp": "2025-01-15T10:00:00Z" }

// clock_in / clock_out / break_start / break_end
{ "type": "clock_in", "client_timestamp": "2025-01-15T09:00:00Z" }
```

---

## Error Responses

```json
{ "error": "UNAUTHORIZED",    "message": "JWT expired" }
{ "error": "FORBIDDEN",       "message": "Insufficient role" }
{ "error": "NOT_FOUND",       "message": "Employee not found" }
{ "error": "PLAN_LIMIT",      "message": "Max seats reached for BASIC plan" }
{ "error": "VALIDATION",      "message": "email is required" }
{ "error": "INTERNAL",        "message": "Database error" }
```
