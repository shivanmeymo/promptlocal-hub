-- Create AI usage tracking table with TEXT user_id for Firebase compatibility
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  usage_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own AI usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert their own AI usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can update their own AI usage" ON public.ai_usage;

-- Create RLS policies
CREATE POLICY "Users can view their own AI usage"
ON public.ai_usage FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own AI usage"
ON public.ai_usage FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own AI usage"
ON public.ai_usage FOR UPDATE
USING (auth.uid()::text = user_id);

-- Drop old function if it exists
DROP FUNCTION IF EXISTS increment_ai_usage(uuid, date, int);

-- Create atomic AI usage increment function with TEXT user_id
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id text,
  p_date date,
  p_max_limit int DEFAULT 4
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count int;
BEGIN
  -- Lock row for update (ensures atomicity)
  SELECT usage_count INTO current_count
  FROM ai_usage
  WHERE user_id = p_user_id AND usage_date = p_date
  FOR UPDATE;
  
  IF current_count IS NULL THEN
    -- No existing record, insert new one
    INSERT INTO ai_usage (user_id, usage_date, usage_count)
    VALUES (p_user_id, p_date, 1);
    RETURN jsonb_build_object('allowed', true, 'count', 1, 'remaining', p_max_limit - 1);
  END IF;
  
  IF current_count >= p_max_limit THEN
    -- Limit exceeded
    RETURN jsonb_build_object('allowed', false, 'count', current_count, 'remaining', 0);
  END IF;
  
  -- Increment counter
  UPDATE ai_usage
  SET usage_count = current_count + 1
  WHERE user_id = p_user_id AND usage_date = p_date;
  
  RETURN jsonb_build_object('allowed', true, 'count', current_count + 1, 'remaining', p_max_limit - (current_count + 1));
END;
$$;
