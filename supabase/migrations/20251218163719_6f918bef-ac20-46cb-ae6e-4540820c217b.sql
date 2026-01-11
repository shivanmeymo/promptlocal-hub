-- Create atomic AI usage increment function
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