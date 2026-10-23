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
