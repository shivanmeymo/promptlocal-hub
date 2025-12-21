-- Drop the existing view
DROP VIEW IF EXISTS public.public_events;

-- Recreate the view with SECURITY INVOKER (default, safe)
CREATE VIEW public.public_events
WITH (security_invoker = true)
AS
SELECT 
    id,
    title,
    description,
    location,
    start_date,
    start_time,
    end_date,
    end_time,
    category,
    other_category,
    is_free,
    price,
    is_online,
    is_recurring,
    recurring_pattern,
    image_url,
    organizer_name,
    organizer_description,
    organizer_website,
    status,
    created_at,
    updated_at,
    approved_at
FROM public.events
WHERE status = 'approved'::event_status;

-- Grant SELECT access to everyone (public events should be readable by anyone)
GRANT SELECT ON public.public_events TO anon, authenticated;