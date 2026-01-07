-- Migration to set up admin user
-- This creates a reusable function to grant admin access

-- Create function to grant admin role to a user
CREATE OR REPLACE FUNCTION grant_admin_role(firebase_uid TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert admin role for the specified user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (firebase_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Admin role granted to user: %', firebase_uid;
END;
$$;

-- Example usage (uncomment and replace with actual Firebase UID):
-- SELECT grant_admin_role('YOUR_FIREBASE_UID_HERE');

-- To find your Firebase UID, you can query existing events:
-- SELECT DISTINCT user_id, COUNT(*) as event_count 
-- FROM public.events 
-- WHERE user_id IS NOT NULL 
-- GROUP BY user_id
-- ORDER BY event_count DESC;

-- Grant admin permissions on the function
GRANT EXECUTE ON FUNCTION grant_admin_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_admin_role(TEXT) TO service_role;

COMMENT ON FUNCTION grant_admin_role IS 'Grants admin role to a Firebase user. Usage: SELECT grant_admin_role(''firebase_uid'');';
