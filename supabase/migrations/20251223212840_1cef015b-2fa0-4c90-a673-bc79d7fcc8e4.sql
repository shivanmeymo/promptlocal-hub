-- Grant SELECT access on public_events view to anon and authenticated roles
GRANT SELECT ON public.public_events TO anon;
GRANT SELECT ON public.public_events TO authenticated;