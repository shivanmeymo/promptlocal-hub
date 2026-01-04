-- =====================================================
-- Migration: Convert Supabase Auth to Firebase Auth
-- This allows using Firebase for authentication while 
-- Supabase manages structured data
-- =====================================================

-- Step 1: Drop all foreign key constraints to auth.users
ALTER TABLE IF EXISTS public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE IF EXISTS public.events 
  DROP CONSTRAINT IF EXISTS events_user_id_fkey;

ALTER TABLE IF EXISTS public.user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE IF EXISTS public.event_subscribers 
  DROP CONSTRAINT IF EXISTS event_subscribers_user_id_fkey;

-- Step 2: Convert user_id columns from UUID to TEXT for Firebase UIDs
-- Firebase UIDs are strings like "xYz123AbC...", not UUIDs

ALTER TABLE public.profiles 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE public.events 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE public.user_roles 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Handle event_subscribers if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_subscribers' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.event_subscribers 
      ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

-- Step 3: Recreate unique constraints and indexes
DROP INDEX IF EXISTS profiles_user_id_key;
CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles(user_id);

DROP INDEX IF EXISTS user_roles_user_id_role_key;
CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles(user_id, role);

CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events(user_id);

-- Step 4: Add helpful comments
COMMENT ON COLUMN public.profiles.user_id IS 'Firebase Authentication UID (string)';
COMMENT ON COLUMN public.events.user_id IS 'Firebase Authentication UID (string)';
COMMENT ON COLUMN public.user_roles.user_id IS 'Firebase Authentication UID (string)';

-- Step 5: Update RLS policies to work with Firebase Auth
-- Note: You'll need to pass Firebase ID token in requests for RLS to work
-- or disable RLS for now and handle permissions in application code

-- Optionally disable RLS temporarily until Firebase integration is complete
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
