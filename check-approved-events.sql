-- Debug: Check approved events in database
-- Run this in Supabase SQL Editor to see if events were actually approved

SELECT 
    id,
    title,
    status,
    user_id,
    approved_at,
    approved_by,
    admin_notes,
    created_at
FROM public.events
WHERE status = 'approved'
ORDER BY approved_at DESC NULLS LAST
LIMIT 20;

-- Check ALL events to see their statuses
SELECT 
    status,
    COUNT(*) as count
FROM public.events
GROUP BY status;
