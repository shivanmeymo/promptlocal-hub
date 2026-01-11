-- Check what's in user_roles table
SELECT * FROM public.user_roles;

-- Check profiles table for specified email
-- Usage: Replace :email_address with the actual email when running this query
SELECT id, user_id, email, full_name FROM public.profiles WHERE email = :email_address;

-- Try to see if there's a mismatch between user_id in user_roles and profiles
SELECT 
    ur.user_id as role_user_id,
    ur.role,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.email
FROM public.user_roles ur
FULL OUTER JOIN public.profiles p ON ur.user_id::uuid = p.id
WHERE p.email = :email_address OR ur.role = 'admin';
