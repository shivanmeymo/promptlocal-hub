-- Fix all UUID columns to TEXT for Firebase Auth compatibility
-- Run this in Supabase Dashboard → SQL Editor

-- STEP 1: Drop ALL foreign key constraints first
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_user_id_fkey;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_approved_by_fkey;

-- STEP 2: Fix user_roles table
ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_unique ON public.user_roles(user_id, role);
COMMENT ON COLUMN public.user_roles.user_id IS 'Firebase Auth UID stored as TEXT';

-- STEP 3: Fix profiles table
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique ON public.profiles(user_id);
COMMENT ON COLUMN public.profiles.user_id IS 'Firebase Auth UID stored as TEXT';

-- STEP 4: Fix events table user_id
ALTER TABLE public.events ALTER COLUMN user_id TYPE TEXT;
CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events(user_id);
COMMENT ON COLUMN public.events.user_id IS 'Firebase Auth UID stored as TEXT';

-- STEP 5: Fix events table approved_by (THIS IS THE KEY FIX FOR YOUR ERROR)
ALTER TABLE public.events ALTER COLUMN approved_by TYPE TEXT;
COMMENT ON COLUMN public.events.approved_by IS 'Firebase Auth UID of admin who approved, stored as TEXT';

-- 5. Fix event_subscribers table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_subscribers') THEN
        ALTER TABLE public.event_subscribers DROP CONSTRAINT IF EXISTS event_subscribers_user_id_fkey;
        ALTER TABLE public.event_subscribers ALTER COLUMN user_id TYPE TEXT;
        CREATE INDEX IF NOT EXISTS event_subscribers_user_id_idx ON public.event_subscribers(user_id);
        COMMENT ON COLUMN public.event_subscribers.user_id IS 'Firebase Auth UID stored as TEXT';
    END IF;
END $$;

-- Verify the changes
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'events', 'user_roles', 'event_subscribers')
    AND column_name IN ('user_id', 'approved_by')
ORDER BY table_name, column_name;
