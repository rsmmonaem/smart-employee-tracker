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
