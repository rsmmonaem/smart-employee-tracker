-- ============================================================
-- TimeGuard — Initial Schema Migration
-- ============================================================

-- Enums
CREATE TYPE user_role      AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'EMPLOYEE');
CREATE TYPE tenant_status  AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
CREATE TYPE tenant_plan    AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');
CREATE TYPE tracking_mode  AS ENUM ('VISIBLE', 'STEALTH');
CREATE TYPE classification AS ENUM ('PRODUCTIVE', 'NEUTRAL', 'UNPRODUCTIVE');
CREATE TYPE alert_type     AS ENUM ('IDLE_TOO_LONG', 'LOW_PRODUCTIVITY', 'ATTENDANCE_ANOMALY');
CREATE TYPE alert_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE match_type     AS ENUM ('APP', 'DOMAIN');

-- Tenants (platform-global, no tenant_id)
CREATE TABLE tenants (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    TEXT NOT NULL,
    slug                    TEXT NOT NULL UNIQUE,
    plan                    tenant_plan NOT NULL DEFAULT 'BASIC',
    status                  tenant_status NOT NULL DEFAULT 'TRIAL',
    screenshot_interval_sec INT NOT NULL DEFAULT 300,
    retention_days          INT NOT NULL DEFAULT 30,
    storage_quota_mb        INT NOT NULL DEFAULT 5000,
    max_teams               INT NOT NULL DEFAULT 5,
    max_seats               INT NOT NULL DEFAULT 10,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (linked to auth.users)
CREATE TABLE users (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role                user_role NOT NULL,
    tracking_mode       tracking_mode NOT NULL DEFAULT 'VISIBLE',
    full_name           TEXT,
    email               TEXT NOT NULL UNIQUE,
    avatar_url          TEXT,
    consent_at          TIMESTAMPTZ,
    device_token_hash   TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_members (
    team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

-- Attendance
CREATE TABLE attendance_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clocked_in_at   TIMESTAMPTZ NOT NULL,
    clocked_out_at  TIMESTAMPTZ,
    total_break_sec INT NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'OPEN' -- OPEN | CLOSED
);

CREATE TABLE break_periods (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at  TIMESTAMPTZ NOT NULL,
    ended_at    TIMESTAMPTZ
);

-- Activity
CREATE TABLE activity_events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_name       TEXT NOT NULL,
    window_title   TEXT,
    domain         TEXT,
    started_at     TIMESTAMPTZ NOT NULL,
    ended_at       TIMESTAMPTZ NOT NULL,
    classification classification NOT NULL DEFAULT 'NEUTRAL',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE idle_periods (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at   TIMESTAMPTZ
);

-- Screenshots & Timelapse
CREATE TABLE screenshots (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    taken_at     TIMESTAMPTZ NOT NULL,
    is_blurred   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE timelapse_jobs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       DATE NOT NULL,
    status     TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | PROCESSING | DONE | FAILED
    video_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Productivity
CREATE TABLE productivity_rules (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    match_type     match_type NOT NULL,
    pattern        TEXT NOT NULL,
    classification classification NOT NULL,
    priority       INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alerts
CREATE TABLE alert_rules (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type           alert_type NOT NULL,
    threshold_sec  INT,
    threshold_pct  INT,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE alerts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         alert_type NOT NULL,
    severity     alert_severity NOT NULL,
    payload      JSONB,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform
CREATE TABLE audit_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id       UUID NOT NULL REFERENCES users(id),
    target_user_id UUID REFERENCES users(id),
    action         TEXT NOT NULL,
    metadata       JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE platform_settings (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_events_tenant_user_time ON activity_events(tenant_id, user_id, started_at DESC);
CREATE INDEX idx_screenshots_tenant_user_time ON screenshots(tenant_id, user_id, taken_at DESC);
CREATE INDEX idx_alerts_tenant_unread ON alerts(tenant_id, is_read, triggered_at DESC);
CREATE INDEX idx_attendance_tenant_user ON attendance_sessions(tenant_id, user_id, clocked_in_at DESC);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
