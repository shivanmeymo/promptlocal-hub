-- Remove the policy that allows anyone to view approved events directly from the events table
-- This exposes organizer_email which is a security risk
DROP POLICY IF EXISTS "Anyone can view approved events" ON public.events;

-- Set security_invoker to false on public_events view so it can be accessed without RLS
-- The view already excludes organizer_email and user_id
ALTER VIEW public.public_events SET (security_invoker = false);

-- Grant SELECT on public_events view to anon and authenticated roles
GRANT SELECT ON public.public_events TO anon;
GRANT SELECT ON public.public_events TO authenticated;