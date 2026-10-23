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
