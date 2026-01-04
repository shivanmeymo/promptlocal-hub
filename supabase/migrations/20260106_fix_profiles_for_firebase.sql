-- Fix profiles table to work with Firebase Auth UIDs instead of Supabase auth.users
-- This migration allows storing Firebase user IDs as TEXT instead of UUID references

-- Drop the foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Change user_id column to TEXT to store Firebase UIDs
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT;

-- Make sure user_id is still unique and indexed
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique ON public.profiles(user_id);

-- Update events table similarly
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_user_id_fkey;
ALTER TABLE public.events ALTER COLUMN user_id TYPE TEXT;
CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events(user_id);

-- Update user_roles table
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_unique ON public.user_roles(user_id, role);

-- Update event_subscribers table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_subscribers') THEN
        ALTER TABLE public.event_subscribers DROP CONSTRAINT IF EXISTS event_subscribers_user_id_fkey;
        ALTER TABLE public.event_subscribers ALTER COLUMN user_id TYPE TEXT;
    END IF;
END $$;

-- Add comment explaining the Firebase integration
COMMENT ON COLUMN public.profiles.user_id IS 'Firebase Auth UID stored as TEXT';
COMMENT ON COLUMN public.events.user_id IS 'Firebase Auth UID stored as TEXT';
COMMENT ON COLUMN public.user_roles.user_id IS 'Firebase Auth UID stored as TEXT';
