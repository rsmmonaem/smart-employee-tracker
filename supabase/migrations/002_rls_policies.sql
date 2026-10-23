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
