-- Drop and recreate view with SECURITY INVOKER (not DEFINER)
DROP VIEW IF EXISTS public.public_events;

CREATE VIEW public.public_events
WITH (security_invoker = true)
AS SELECT 
  id, user_id, organizer_name, organizer_email, organizer_description,
  organizer_website, title, description, start_date, start_time, 
  end_date, end_time, location, category, is_free, price, 
  image_url, status, created_at, updated_at, is_online, 
  is_recurring, recurring_pattern, other_category, approved_at
FROM public.events
WHERE status = 'approved';

GRANT SELECT ON public.public_events TO anon, authenticated;