-- =====================================================
-- QUICK ADMIN SETUP - Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Find your Firebase UID
-- Run this query to see existing user IDs from events:
SELECT DISTINCT 
  user_id,
  COUNT(*) as event_count,
  MAX(created_at) as last_event
FROM public.events 
WHERE user_id IS NOT NULL 
GROUP BY user_id
ORDER BY event_count DESC;

-- Step 2: Grant admin role to your user
-- Replace 'YOUR_FIREBASE_UID' with the actual Firebase UID from step 1
-- or from Firebase Console (Authentication → Users → find shivan.meymo@gmail.com → copy UID)

-- UNCOMMENT AND REPLACE THE UID BELOW:
/*
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_FIREBASE_UID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- Step 3: Verify the admin role was created
-- UNCOMMENT AND REPLACE THE UID BELOW:
/*
SELECT * 
FROM public.user_roles 
WHERE user_id = 'YOUR_FIREBASE_UID_HERE';
*/

-- Step 4: Check if the user_roles table exists and has correct structure
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_roles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- If you don't see your user_id in the events table, you can:
-- 1. Log in to your app with shivan.meymo@gmail.com
-- 2. Create a test event
-- 3. Then run this query again to see your user_id

-- To see all admin users:
SELECT * FROM public.user_roles WHERE role = 'admin';

-- To remove admin role (if needed):
-- DELETE FROM public.user_roles WHERE user_id = 'YOUR_FIREBASE_UID_HERE' AND role = 'admin';
