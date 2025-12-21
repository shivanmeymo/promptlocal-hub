-- Drop and recreate public_events view without sensitive fields
DROP VIEW IF EXISTS public.public_events;

CREATE VIEW public.public_events AS
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

-- Grant select access to anon and authenticated users
GRANT SELECT ON public.public_events TO anon;
GRANT SELECT ON public.public_events TO authenticated;

COMMENT ON VIEW public.public_events IS 'Sanitized public view of approved events - excludes organizer_email and user_id for privacy';