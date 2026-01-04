-- =====================================================
-- COMPLETE FIREBASE MIGRATION - Drop ALL policies first
-- =====================================================

-- Step 1: Drop ALL policies on profiles table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
END $$;

-- Step 2: Drop ALL policies on events table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'events') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.events';
    END LOOP;
END $$;

-- Step 3: Drop ALL policies on user_roles table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_roles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.user_roles';
    END LOOP;
END $$;

-- Step 4: Drop foreign key constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_user_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Step 5: NOW convert the column types
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.events ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Step 6: Disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Step 7: Recreate indexes
DROP INDEX IF EXISTS profiles_user_id_key;
CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles(user_id);

DROP INDEX IF EXISTS events_user_id_idx;
CREATE INDEX events_user_id_idx ON public.events(user_id);

-- Step 8: Verify the changes
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'events', 'user_roles') 
  AND column_name = 'user_id'
ORDER BY table_name;
