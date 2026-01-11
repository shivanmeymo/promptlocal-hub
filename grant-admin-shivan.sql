-- Grant admin role to shivan.meymo@gmail.com
-- Run this in Supabase SQL Editor

-- First, get the Firebase UID for the user
-- You need to log in as shivan.meymo@gmail.com and check the browser console for the Firebase UID
-- Or check the profiles table:
-- SELECT id FROM public.profiles WHERE email = 'shivan.meymo@gmail.com';

-- Once you have the UID, run this (replace 'FIREBASE_UID_HERE' with actual UID):
INSERT INTO public.user_roles (user_id, role)
VALUES ('FIREBASE_UID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the admin role was granted:
SELECT * FROM public.user_roles WHERE role = 'admin';

-- Alternative: If you need to find the UID from profiles table first:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'
-- FROM public.profiles
-- WHERE email = 'shivan.meymo@gmail.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
