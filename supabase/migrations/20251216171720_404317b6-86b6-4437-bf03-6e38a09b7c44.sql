-- Create AI usage tracking table
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  usage_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage"
ON public.ai_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage"
ON public.ai_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI usage"
ON public.ai_usage FOR UPDATE
USING (auth.uid() = user_id);

-- Fix event_notifications security: Remove user_id IS NULL access
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.event_notifications;
CREATE POLICY "Users can view their own notifications"
ON public.event_notifications FOR SELECT
USING (auth.uid() = user_id);

-- Add approval_token column to events for secure approve/reject links
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS approval_token uuid DEFAULT gen_random_uuid();