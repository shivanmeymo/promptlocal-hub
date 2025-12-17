-- Drop existing public_events view
DROP VIEW IF EXISTS public.public_events;

-- Create updated public_events view WITHOUT organizer_email
CREATE VIEW public.public_events WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  description,
  start_date,
  start_time,
  end_date,
  end_time,
  location,
  category,
  is_free,
  price,
  image_url,
  status,
  organizer_name,
  organizer_description,
  organizer_website,
  is_online,
  is_recurring,
  recurring_pattern,
  other_category,
  created_at,
  updated_at,
  approved_at,
  user_id
FROM public.events
WHERE status = 'approved';