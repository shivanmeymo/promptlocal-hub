-- Add token_created_at column to track when approval tokens were generated
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS token_created_at TIMESTAMP WITH TIME ZONE;

-- Set existing tokens to have a creation date (will expire immediately, forcing regeneration)
UPDATE public.events 
SET token_created_at = created_at 
WHERE approval_token IS NOT NULL AND token_created_at IS NULL;