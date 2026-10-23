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
-- ============================================================
-- TimeGuard — Row-Level Security Policies
-- ============================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams                ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_periods        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE idle_periods         ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots          ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelapse_jobs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;

-- Helper: get caller's tenant_id
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT tenant_id FROM users WHERE id = auth.uid()
$$;

-- Helper: get caller's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql STABLE AS $$
    SELECT role FROM users WHERE id = auth.uid()
$$;

-- ── users ──────────────────────────────────────────────────
-- SUPER_ADMIN: see all
CREATE POLICY "superadmin_users_all" ON users
    FOR ALL USING (get_my_role() = 'SUPER_ADMIN');

-- TENANT_ADMIN: see users in own tenant
CREATE POLICY "tenant_admin_users_tenant" ON users
    FOR ALL USING (
        get_my_role() = 'TENANT_ADMIN'
        AND tenant_id = get_my_tenant_id()
    );

-- EMPLOYEE: see only self
CREATE POLICY "employee_users_self" ON users
    FOR SELECT USING (id = auth.uid());

-- ── Tenant-scoped tables (generic pattern) ─────────────────
-- TENANT_ADMIN: full access to own tenant rows
-- EMPLOYEE: read-only own rows

-- teams
CREATE POLICY "tenant_admin_teams" ON teams
    FOR ALL USING (get_my_role() = 'TENANT_ADMIN' AND tenant_id = get_my_tenant_id());
CREATE POLICY "employee_teams_read" ON teams
    FOR SELECT USING (
        get_my_role() = 'EMPLOYEE'
        AND tenant_id = get_my_tenant_id()
    );
CREATE POLICY "superadmin_teams" ON teams FOR ALL USING (get_my_role() = 'SUPER_ADMIN');

-- team_members
CREATE POLICY "tenant_admin_team_members" ON team_members
    FOR ALL USING (get_my_role() = 'TENANT_ADMIN' AND tenant_id = get_my_tenant_id());
CREATE POLICY "employee_team_members_self" ON team_members
    FOR SELECT USING (get_my_role() = 'EMPLOYEE' AND user_id = auth.uid());
CREATE POLICY "superadmin_team_members" ON team_members FOR ALL USING (get_my_role() = 'SUPER_ADMIN');

-- attendance_sessions
CREATE POLICY "tenant_admin_attendance" ON attendance_sessions
    FOR ALL USING (get_my_role() = 'TENANT_ADMIN' AND tenant_id = get_my_tenant_id());
CREATE POLICY "employee_attendance_self" ON attendance_sessions
    FOR ALL USING (get_my_role() = 'EMPLOYEE' AND user_id = auth.uid());
CREATE POLICY "superadmin_attendance" ON attendance_sessions FOR ALL USING (get_my_role() = 'SUPER_ADMIN');

-- activity_events
CREATE POLICY "tenant_admin_activity" ON activity_events
    FOR ALL USING (get_my_role() = 'TENANT_ADMIN' AND tenant_id = get_my_tenant_id());
CREATE POLICY "employee_activity_self" ON activity_events
    FOR SELECT USING (get_my_role() = 'EMPLOYEE' AND user_id = auth.uid());
CREATE POLICY "superadmin_activity" ON activity_events FOR ALL USING (get_my_role() = 'SUPER_ADMIN');

-- screenshots
CREATE POLICY "tenant_admin_screenshots" ON screenshots
    FOR ALL USING (get_my_role() = 'TENANT_ADMIN' AND tenant_id = get_my_tenant_id());
CREATE POLICY "employee_screenshots_self" ON screenshots
    FOR SELECT USING (get_my_role() = 'EMPLOYEE' AND user_id = auth.uid());
CREATE POLICY "superadmin_screenshots" ON screenshots FOR ALL USING (get_my_role() = 'SUPER_ADMIN');

-- productivity_rules
CREATE POLICY "tenant_admin_rules" ON productivity_rules
    FOR ALL USING (get_my_role() = 'TENANT_ADMIN' AND tenant_id = get_my_tenant_id());
CREATE POLICY "employee_rules_read" ON productivity_rules
    FOR SELECT USING (get_my_role() = 'EMPLOYEE' AND tenant_id = get_my_tenant_id());
CREATE POLICY "superadmin_rules" ON productivity_rules FOR ALL USING (get_my_role() = 'SUPER_ADMIN');

-- alerts
CREATE POLICY "tenant_admin_alerts" ON alerts
    FOR ALL USING (get_my_role() = 'TENANT_ADMIN' AND tenant_id = get_my_tenant_id());
CREATE POLICY "superadmin_alerts" ON alerts FOR ALL USING (get_my_role() = 'SUPER_ADMIN');

-- audit_logs (SUPER_ADMIN only)
CREATE POLICY "superadmin_audit" ON audit_logs FOR ALL USING (get_my_role() = 'SUPER_ADMIN');
-- ============================================================
-- TimeGuard — Supabase Storage Bucket Setup
-- ============================================================

-- Create private screenshots bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'screenshots',
    'screenshots',
    FALSE,                          -- private bucket
    52428800,                       -- 50 MB per file
    ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Bucket policy: Tenant Admin can read screenshots from own tenant
CREATE POLICY "tenant_admin_read_screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'screenshots'
        AND (storage.foldername(name))[1] = (
            SELECT tenant_id::TEXT FROM public.users WHERE id = auth.uid()
        )
        AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('TENANT_ADMIN', 'SUPER_ADMIN')
    );

-- Bucket policy: Employee can upload own screenshots (via presigned URL from API)
CREATE POLICY "employee_upload_screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'screenshots'
        AND (storage.foldername(name))[2] = auth.uid()::TEXT
    );

-- Bucket policy: Super Admin can read all
CREATE POLICY "superadmin_read_all_screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'screenshots'
        AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN'
    );
-- ============================================================
-- TimeGuard — Agent Tracking & Screenshot Policies
-- ============================================================

-- Fix functions to be SECURITY DEFINER to prevent recursive RLS evaluation
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- Grant schema privileges
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Allow authenticated employees to insert their own activity events
DROP POLICY IF EXISTS "employee_insert_activity" ON public.activity_events;
CREATE POLICY "employee_insert_activity" ON public.activity_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow authenticated employees to insert screenshot metadata
DROP POLICY IF EXISTS "employee_insert_screenshots" ON public.screenshots;
CREATE POLICY "employee_insert_screenshots" ON public.screenshots
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow public read on screenshots bucket
UPDATE storage.buckets SET public = TRUE WHERE id = 'screenshots';

-- Policy for reading screenshots
DROP POLICY IF EXISTS "public_read_screenshots" ON storage.objects;
CREATE POLICY "public_read_screenshots" ON storage.objects
    FOR SELECT USING (bucket_id = 'screenshots');

-- Allow authenticated users to upload screenshots
DROP POLICY IF EXISTS "employee_upload_screenshots" ON storage.objects;
CREATE POLICY "employee_upload_screenshots" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'screenshots' AND auth.uid() IS NOT NULL);
-- ============================================================
-- Automatically create a public.users row on auth.users INSERT
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'EMPLOYEE'::user_role)
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing auth users into public.users
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    'EMPLOYEE'::user_role
FROM auth.users
ON CONFLICT (id) DO NOTHING;
-- ============================================================
-- Single Active Session Per User Constraint & Auto-Close Trigger
-- ============================================================

-- 1. Close any older duplicate open sessions, leaving at most 1 open session per user
WITH ranked_open AS (
    SELECT id, user_id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY clocked_in_at DESC) as rn
    FROM public.attendance_sessions
    WHERE status = 'OPEN'
)
UPDATE public.attendance_sessions
SET status = 'CLOSED',
    clocked_out_at = COALESCE(clocked_out_at, NOW())
WHERE id IN (
    SELECT id FROM ranked_open WHERE rn > 1
);

-- 2. Trigger function to automatically close any prior open session before a new one opens
CREATE OR REPLACE FUNCTION public.ensure_single_open_session_per_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'OPEN' THEN
        UPDATE public.attendance_sessions
        SET status = 'CLOSED',
            clocked_out_at = COALESCE(clocked_out_at, NEW.clocked_in_at)
        WHERE user_id = NEW.user_id
          AND status = 'OPEN'
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_single_open_session ON public.attendance_sessions;
CREATE TRIGGER trg_ensure_single_open_session
BEFORE INSERT OR UPDATE OF status ON public.attendance_sessions
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_open_session_per_user();

-- 3. Unique Partial Index: Guarantees at most ONE open session per user in the entire database
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_open_session
ON public.attendance_sessions (user_id)
WHERE status = 'OPEN';
-- Migration 006: Add optional user_id to productivity_rules table if desired
ALTER TABLE productivity_rules ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
