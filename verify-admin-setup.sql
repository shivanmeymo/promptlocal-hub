-- Check what's in user_roles table
SELECT * FROM public.user_roles;

-- Check profiles table for shivan.meymo@gmail.com
SELECT id, user_id, email, full_name FROM public.profiles WHERE email = 'shivan.meymo@gmail.com';

-- Try to see if there's a mismatch between user_id in user_roles and profiles
SELECT 
    ur.user_id as role_user_id,
    ur.role,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.email
FROM public.user_roles ur
FULL OUTER JOIN public.profiles p ON ur.user_id::uuid = p.id
WHERE p.email = 'shivan.meymo@gmail.com' OR ur.role = 'admin';
