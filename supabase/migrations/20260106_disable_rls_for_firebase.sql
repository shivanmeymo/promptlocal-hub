-- =====================================================
-- Disable RLS for Firebase Auth Integration
-- Since Firebase handles authentication separately,
-- we'll manage permissions at the application level
-- =====================================================

-- Disable RLS on all tables
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events_public DISABLE ROW LEVEL SECURITY;

-- Note: With Firebase Auth, you have two options for security:
-- 1. Handle all permissions in your application code (current approach)
-- 2. Create a Supabase Edge Function to verify Firebase tokens (advanced)
--
-- For now, we're using option 1 - application-level security
