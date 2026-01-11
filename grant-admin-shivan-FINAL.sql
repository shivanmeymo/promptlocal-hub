-- Grant admin role to shivan.meymo@gmail.com
-- Run this in Supabase Dashboard → SQL Editor
-- IMPORTANT: user_roles.user_id should be the Firebase UID (user_id from profiles), NOT the profile id

-- First, delete the wrong entry if it exists
DELETE FROM public.user_roles WHERE user_id = 'ed05900b-63e9-4773-83b7-7511e15c2c78';

-- Insert with the correct Firebase UID
INSERT INTO public.user_roles (user_id, role)
VALUES ('VjNhy9vaDfRgF8hxbA1wktb4AKJ2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the admin role was granted
SELECT 
    ur.user_id,
    ur.role,
    p.email,
    p.full_name
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.user_id
WHERE ur.role = 'admin';
