-- Make user_id in events table optional to allow guest event submissions
-- This is a temporary fix while Firebase auth is being set up
-- In production, you may want to enforce NOT NULL after confirming auth works

ALTER TABLE public.events ALTER COLUMN user_id DROP NOT NULL;

-- Add comment explaining this is optional
COMMENT ON COLUMN public.events.user_id IS 'Firebase Auth UID (TEXT) - Optional for guest submissions, required for authenticated users';
