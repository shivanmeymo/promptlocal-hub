-- Complete the rest of the migration that failed
-- This ensures all indexes and constraints are properly set up

-- Drop and recreate constraints (not just indexes)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles(user_id);

DROP INDEX IF EXISTS events_user_id_idx;
CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events(user_id);

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_key ON public.user_roles(user_id, role);

-- Verify RLS is disabled
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON COLUMN public.profiles.user_id IS 'Firebase Authentication UID (string format)';
COMMENT ON COLUMN public.events.user_id IS 'Firebase Authentication UID (string format)';
COMMENT ON COLUMN public.user_roles.user_id IS 'Firebase Authentication UID (string format)';
