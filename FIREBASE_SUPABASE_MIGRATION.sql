-- =====================================================
-- COMPLETE FIREBASE AUTH INTEGRATION FOR SUPABASE
-- Run this entire script in your Supabase SQL Editor
-- =====================================================

-- STEP 1: Drop ALL RLS policies first (they depend on columns)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all events" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;
DROP POLICY IF EXISTS "Admins can do everything" ON public.events;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all subscribers" ON public.event_subscribers;
DROP POLICY IF EXISTS "Users can subscribe to events" ON public.event_subscribers;
DROP POLICY IF EXISTS "Users can unsubscribe" ON public.event_subscribers;
DROP POLICY IF EXISTS "activities_select_public" ON public.activities;
DROP POLICY IF EXISTS "activities_insert_auth" ON public.activities;
DROP POLICY IF EXISTS "activities_update_creator" ON public.activities;
DROP POLICY IF EXISTS "activities_delete_creator" ON public.activities;
DROP POLICY IF EXISTS "activity_members_select_members" ON public.activity_members;
DROP POLICY IF EXISTS "activity_members_insert_self" ON public.activity_members;
DROP POLICY IF EXISTS "activity_members_update_self_or_creator" ON public.activity_members;
DROP POLICY IF EXISTS "activity_members_delete_self_or_creator" ON public.activity_members;
DROP POLICY IF EXISTS "activity_messages_select_members" ON public.activity_messages;
DROP POLICY IF EXISTS "activity_messages_insert_members" ON public.activity_messages;
DROP POLICY IF EXISTS "activity_messages_update_self_or_creator" ON public.activity_messages;
DROP POLICY IF EXISTS "activity_messages_delete_self_or_creator" ON public.activity_messages;
DROP POLICY IF EXISTS "Public can view events_public" ON public.events_public;
DROP POLICY IF EXISTS "Admins can insert events_public" ON public.events_public;
DROP POLICY IF EXISTS "Admins can update events_public" ON public.events_public;
DROP POLICY IF EXISTS "Admins can delete events_public" ON public.events_public;
DROP POLICY IF EXISTS "Users can upload to their folder" ON storage.objects;

-- STEP 2: Remove foreign key constraints to auth.users
-- =====================================================
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE IF EXISTS public.events DROP CONSTRAINT IF EXISTS events_user_id_fkey;
ALTER TABLE IF EXISTS public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE IF EXISTS public.event_subscribers DROP CONSTRAINT IF EXISTS event_subscribers_user_id_fkey;

-- STEP 3: Convert user_id columns from UUID to TEXT
-- =====================================================
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.events ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Event subscribers (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_subscribers' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.event_subscribers ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

-- Activities tables (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activities') THEN
    ALTER TABLE public.activities ALTER COLUMN creator_id TYPE TEXT USING creator_id::TEXT;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_members') THEN
    ALTER TABLE public.activity_members ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_messages') THEN
    ALTER TABLE public.activity_messages ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

-- STEP 4: Recreate constraints and indexes
-- =====================================================
DROP INDEX IF EXISTS profiles_user_id_key;
CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles(user_id);

DROP INDEX IF EXISTS user_roles_user_id_role_key;
CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles(user_id, role);

CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events(user_id);

-- STEP 5: Disable RLS (Row Level Security)
-- =====================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_subscribers') THEN
    ALTER TABLE public.event_subscribers DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activities') THEN
    ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_members') THEN
    ALTER TABLE public.activity_members DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_messages') THEN
    ALTER TABLE public.activity_messages DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events_public') THEN
    ALTER TABLE public.events_public DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- STEP 6: Add helpful documentation
-- =====================================================
COMMENT ON COLUMN public.profiles.user_id IS 'Firebase Authentication UID (string format)';
COMMENT ON COLUMN public.events.user_id IS 'Firebase Authentication UID (string format)';
COMMENT ON COLUMN public.user_roles.user_id IS 'Firebase Authentication UID (string format)';

-- Done! Your database is now ready for Firebase Auth integration
